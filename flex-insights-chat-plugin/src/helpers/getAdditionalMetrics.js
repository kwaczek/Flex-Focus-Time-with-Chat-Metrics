import { RUNTIMEDOMAIN, getConfig } from "../config";

export const getAdditionalMetrics = async (payload, store) => {
    const configuredFeatures = getConfig()

    const {
        task: {
            sid,
            taskSid,
            attributes: {
                channelSid
            }
        }
    } = payload
    const state = store.getState()
    const reservationAcceptedTime = window.handleTimeTracker.reservations[sid].reservationAcceptedTime;
    const workerName = state.flex.worker.attributes.contact_uri.split(":")[1];
    const token = state.flex.session.ssoTokenPayload.token;



    const response = await fetch(`${RUNTIMEDOMAIN}/get-channel-messages`, {
        headers: {
            "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify({
            channelSid: channelSid,
            token: token,
            workerName: workerName,
            reservationAccepted: reservationAcceptedTime,
            configuredFeatures: configuredFeatures
        })

       // body: `channelSid=${channelSid}&token=${token}&workerName=${workerName}&reservationAccepted=${reservationAcceptedTime}&configuredFeatures=${configuredFeatures}`
    });
    const messagesResponse = await response.json();

    return messagesResponse

}