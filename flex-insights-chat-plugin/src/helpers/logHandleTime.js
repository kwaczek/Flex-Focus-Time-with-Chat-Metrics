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

    if (CHANNELS.includes(channelName) && configuredFeatures.includes('1')) {
        const additionalMetrics = await getAdditionalMetrics(payload, store);
        return additionalMetrics
    } else {
        console.log("Channel not allowed or additional features are disabled")
    }
}

export const writeHandleTime = async (payload, store) => {
    const configuredFeatures = getConfig()

    const taskSid = payload.task.reservationSid ? payload.task.reservationSid : payload.task.sid;

    const taskInWindowStore = window.handleTimeTracker.reservations[taskSid];
    const handleTime = taskInWindowStore.handleTime || 0;

    const additionalMetrics = await getMetrics(payload, store);
    
    let attributes = payload.task.attributes;

    const keys = Object.keys(FEATURES)

    if (typeof (attributes.conversations) !== 'undefined') {
        attributes.conversations[FOCUSTIMEATTRIBUTE] = handleTime;

        
        (configuredFeatures[0] == '1') ? attributes.conversations[FEATURES['firstAgentResponse']] = additionalMetrics[0] : null;
        (configuredFeatures[1] == '1') ? attributes.conversations[FEATURES['averageResponseTime']] = additionalMetrics[1] : null;
        (configuredFeatures[2] == '1') ? attributes.conversations[FEATURES['agentMessages']] = additionalMetrics[2] : null;
        (configuredFeatures[3] == '1') ? attributes.conversations[FEATURES['customerMessages']] = additionalMetrics[3] : null;
        (configuredFeatures[4] == '1') ? attributes.conversations[FEATURES['averageAgentLength']] = additionalMetrics[4] : null;
        (configuredFeatures[5] == '1') ? attributes.conversations[FEATURES['averageCustomerLength']] = additionalMetrics[5] : null;

    } else {
        attributes.conversations = {
            [FOCUSTIMEATTRIBUTE]: handleTime,
            ... (configuredFeatures[0] == '1') && { [FEATURES['firstAgentResponse']]: additionalMetrics[0] },
            ... (configuredFeatures[1] == '1') && { [FEATURES['averageResponseTime']]: additionalMetrics[1] },
            ... (configuredFeatures[2] == '1') && { [FEATURES['agentMessages']]: additionalMetrics[2] },
            ... (configuredFeatures[3] == '1') && { [FEATURES['customerMessages']]: additionalMetrics[3] },
            ... (configuredFeatures[4] == '1') && { [FEATURES['averageAgentLength']]: additionalMetrics[4] },
            ... (configuredFeatures[5] == '1') && { [FEATURES['averageCustomerLength']]: additionalMetrics[5] }
        }
    }

    const updatedAttributes = await payload.task.setAttributes(attributes);
 
    taskCompletedAction(taskSid)
}