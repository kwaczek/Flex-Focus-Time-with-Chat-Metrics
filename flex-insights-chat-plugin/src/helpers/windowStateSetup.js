const retrieveStateOnLoad = () => {
    window.handleTimeTracker = JSON.parse(localStorage.getItem('handleTimeTracker'));
}

const initWindowStateIfNull = () => {
    window.handleTimeTracker = window.handleTimeTracker || { reservations: {} }
}

export const updateLocalStorage = handleTimeTracker => {
    localStorage.setItem('handleTimeTracker', JSON.stringify(handleTimeTracker));
}

const saveStateBeforeUnload = store => window.onbeforeunload = () => {
    // Update the handle time of the task thsat is currently open
    //updateCurrentHandleTime(store);
    // Store the state in localstorage for next retrieval
    updateLocalStorage(window.handleTimeTracker);
}

export const setupWindowState = store => {
    retrieveStateOnLoad();
    initWindowStateIfNull();
    saveStateBeforeUnload();
}