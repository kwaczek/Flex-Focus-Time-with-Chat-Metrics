import { omit } from 'lodash';
import { updateLocalStorage } from './windowStateSetup';

export const taskSelectedAction = (currentTaskSid, currentTaskPreviousHandleTime, previousTaskSid, previousTaskSelectedTime, previousTaskHandleTime) => {
    const currentDate = new Date();
    const state = window.handleTimeTracker;
    const previousTaskInState = state.reservations[previousTaskSid];
    

    if (previousTaskSid && previousTaskInState) {
        const previousTaskSelectedTimeNew = new Date(previousTaskSelectedTime);
        const timeDifference = currentDate.getTime() - previousTaskSelectedTimeNew.getTime();
        const seconds = Math.abs(timeDifference / 1000);
        const handleTime = previousTaskInState.wrapup ? previousTaskHandleTime : previousTaskHandleTime + seconds;

        window.handleTimeTracker = Object.assign({}, state, {
            reservations: {
                ...state.reservations,
                [currentTaskSid]: {
                    ...state.reservations[currentTaskSid],
                    selectedTime: currentDate,
                    active: true,
                    handleTime: currentTaskPreviousHandleTime
                },
                [previousTaskSid]: {
                    ...state.reservations[previousTaskSid],
                    active: false,
                    handleTime: handleTime
                }
            }
        });
    } else {
        window.handleTimeTracker = Object.assign({}, state, {
            reservations: {
                ...state.reservations,
                [currentTaskSid]: {
                    ...state.reservations[currentTaskSid],
                    selectedTime: currentDate,
                    active: true,
                    ...(!state.reservations[currentTaskSid] ? {
                        handleTime: 0
                    } : {})
                }
            }
        });
    }

    updateLocalStorage(window.handleTimeTracker);

}

export const reservationAcceptedAction = (currentTaskSid) => {
    const state = window.handleTimeTracker
    const currentDate = new Date().toISOString();

    window.handleTimeTracker = Object.assign({}, state, {
        reservations: {
            ...state.reservations,
            [currentTaskSid]: {
                ...state.reservations[currentTaskSid],
                reservationAcceptedTime: currentDate
            }
        }
    })
    updateLocalStorage(window.handleTimeTracker);
    
}

export const taskWrappingAction = (taskSid, handleTime, wrapuped) => {
    const state = window.handleTimeTracker
    window.handleTimeTracker = Object.assign({}, state, {
        reservations: {
            ...state.reservations,
            [taskSid]: {
                ...state.reservations[taskSid],
                active: false,
                handleTime,
                ...(wrapuped ? {
                    wrapup: true
                } : {})
            }
        }
    })
    updateLocalStorage(window.handleTimeTracker);
}

export const taskCompletedAction = (taskSid) => {
    const state = window.handleTimeTracker
    window.handleTimeTracker = Object.assign({}, state, {
        reservations: omit(state.reservations, taskSid)
    })
    updateLocalStorage(window.handleTimeTracker);
}