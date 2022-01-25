import { taskSelectedAction, taskWrappingAction, taskCompletedAction, reservationAcceptedAction } from "./windowStateActions";
import { getAdditionalMetrics } from "./getAdditionalMetrics";
import { CHANNELS, FOCUSTIMEATTRIBUTE, FEATURES, getConfig } from "../config";


export const logHandleTime = (payload, store) => {
    const state = store.getState();

    //No task is selected
    if (typeof payload.sid === 'undefined') {
        return
    }

    const currentTaskSid = payload.sid;
    const previousTaskSid = state.flex.view.selectedTaskSid;

    //Only execute if a new task is selected, do nothinsg if the same task is selected again
    if (previousTaskSid !== currentTaskSid) {
        const existingReservations = window.handleTimeTracker.reservations;

        let previousTaskSelectedTime = '';
        let previousTaskHandleTime = '';

        if (Object.keys(existingReservations).length > 0) {
            const { selectedTime, handleTime } = previousTaskSid in existingReservations ?
                { selectedTime: existingReservations[previousTaskSid].selectedTime, handleTime: existingReservations[previousTaskSid].handleTime } :
                { selectedTime: 0, handleTime: 0 };
            previousTaskSelectedTime = selectedTime;
            previousTaskHandleTime = handleTime;
        }

        const currentTaskPreviousHandleTime = currentTaskSid in existingReservations ? existingReservations[currentTaskSid].handleTime : 0;

        taskSelectedAction(currentTaskSid, currentTaskPreviousHandleTime, previousTaskSid, previousTaskSelectedTime, previousTaskHandleTime)

    }

};

export const writeAcceptTime = (payload) => {
    const channelName = payload.task.taskChannelUniqueName

    if (CHANNELS.includes(channelName)) {
        const currentTaskSid = payload.sid;
        reservationAcceptedAction(currentTaskSid)
    }
}

export const handleOnDisconnectVoiceClient = (payload, manager) => {
    const call_sid = payload.parameters.CallSid;
    let flag = false;
    const tasks = manager.store.getState().flex.worker.tasks;

    for (let [, task] of tasks) {
        if (task.conference && task.conference.participants) {
            for (let i = 0; i < task.conference.participants.length; i++) {
                let participantCallSid = task.conference.participants[i].callSid;
                if (participantCallSid === call_sid) {
                    flag = true;
                    break;
                }
            }
            if (flag) {
                calculateHandlTime(task, true);
                break;
            }
        }
    }
}

export const calculateHandlTime = (payload, wrapuped = false) => {
    const taskSid = payload.reservationSid || payload.sid;
    const taskInWindowStore = window.handleTimeTracker.reservations[taskSid];
    const currentDate = new Date();
    const previousTaskSelectedTime = new Date(taskInWindowStore.selectedTime);
    const timeDifference = currentDate.getTime() - previousTaskSelectedTime.getTime();
    const seconds = Math.abs(timeDifference / 1000);

    const handleTime = taskInWindowStore.handleTime + seconds;

    taskWrappingAction(taskSid, handleTime, wrapuped)
}

export const handleOnBeforeCompleteTask = async (payload, manager) => {
    await writeHandleTime(payload, store, manager);
};

export const getMetrics = async (payload, store) => {
    const channelName = payload.task.taskChannelUniqueName
    const configuredFeatures = getConfig()
    if (CHANNELS.includes(channelName) && Object.keys(configuredFeatures).length > 0) {
        const additionalMetrics = await getAdditionalMetrics(payload, store);
        return additionalMetrics
    } else {
        console.log("Flex Insights Plugin: The channel not allowed or additional features are disabled")
        const additionalMetrics = {}
        return additionalMetrics
    }
}

export const writeHandleTime = async (payload, store) => {
    const taskSid = payload.task.reservationSid ? payload.task.reservationSid : payload.task.sid;

    const taskInWindowStore = window.handleTimeTracker.reservations[taskSid];
    const handleTime = taskInWindowStore.handleTime || 0;

    const additionalMetrics = await getMetrics(payload, store);

    const newMetrics = {}

    newMetrics[FOCUSTIMEATTRIBUTE] = handleTime;

    const keys = Object.keys(additionalMetrics)
    keys.forEach( key => {
        return newMetrics[FEATURES[key]] = additionalMetrics[key] 
    })

    const newAttributes = {...payload.task.attributes, conversations: {...(payload.task.attributes.conversations || {}), ...newMetrics}}
    const updatedAttributes = await payload.task.setAttributes(newAttributes);

    taskCompletedAction(taskSid)
}