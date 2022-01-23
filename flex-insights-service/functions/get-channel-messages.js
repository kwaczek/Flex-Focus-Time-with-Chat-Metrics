const axios = require('axios');

exports.handler = async function (context, event, callback) {
  const validateToken = async (token, accountSid, authToken) => {
    try {
      return await axios.post(
        `https://iam.twilio.com/v1/Accounts/${accountSid}/Tokens/validate`,
        { token: token },
        { auth: { username: accountSid, password: authToken } }
      );
    } catch (e) {
      console.error("failed to validate token", e.response.data);
      throw e;
    }
  };

  const response = new Twilio.Response();
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS POST');
  response.appendHeader('Content-Type', 'application/json');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  let client = context.getTwilioClient();

  const authed = await validateToken(event.token, context.ACCOUNT_SID, context.AUTH_TOKEN);
  if (typeof authed !== 'object' || !authed.data || authed.data.valid !== true) {
    console.log('couldn\'t auth', event.Token);
    return callback(null, response);
  }

  const workerName = event.workerName
  const dateAccepted = event.reservationAccepted
  const channelSid = event.channelSid
  const configuredFeatures = event.configuredFeatures
  const chatService = context.TWILIO_CHAT_SERVICE;

  response.body = new Array(configuredFeatures.length);

  client.chat.services(chatService)
    .channels(channelSid)
    .messages
    .list()
    .then(messages => {
      // agent first reply
      if (configuredFeatures[0] == '1') {
        const agentFirstResponse = messages.find(m => m.from === workerName);
        let firstAgentMessageDuration = 0;

        if (agentFirstResponse) {
          const agentFirstResponseTimeUTC = new Date(new Date(agentFirstResponse.dateCreated).toISOString());
          const dateAcceptedUTC = new Date(dateAccepted);
          firstAgentMessageDuration = (agentFirstResponseTimeUTC - dateAcceptedUTC) / 1000;
          response.body[0] = firstAgentMessageDuration
        }
      }

      // average message time
      if (configuredFeatures[1] == '1') {
        let durations = []

        for (let i = 0; i < messages.length; i++) {
          if (i > 0) {
            if (messages[i].from === workerName && messages[i].from !== messages[i - 1].from) {
              durations.push((new Date(messages[i].dateCreated) - new Date(messages[i - 1].dateCreated)) / 1000)
            }
          }
        }
        durations.shift() // exclude first agent response
        const averageTime = (durations.length > 0) ? durations.reduce((a, b) => a + b, 0) / durations.length : null
        response.body[1] = averageTime
      }

      // agent message count
      if (configuredFeatures[2] == '1') {
        const agentMessages = messages.filter(({ from }) => from === workerName).length
        response.body[2] = agentMessages
      }

      // customer message count
      if (configuredFeatures[3] == '1') {
        const customerMessages = messages.filter(({ from }) => from != workerName).length
        response.body[3] = customerMessages
      }

      // agent average length
      if (configuredFeatures[4] == '1') {
        const agentMessages = messages.filter(({ from }) => from === workerName).length
        let totalLength = 0

        for (let i = 0; i < messages.length; i++) {
          (messages[i].from === workerName) ? totalLength += messages[i].body.length : null
        }

        const averageAgentLength = totalLength / agentMessages
        response.body[4] = averageAgentLength
      }

      // customer average lenght
      if (configuredFeatures[5] == '1') {
        const customerMessages = messages.filter(({ from }) => from != workerName).length
        let totalLength = 0

        for (let i = 0; i < messages.length; i++) {
          (messages[i].from != workerName) ? totalLength += messages[i].body.length : null
        }

        const averageCustomerLength = totalLength / customerMessages
        response.body[5] = averageCustomerLength
      }

      return response
    }).then(response => {
      callback(null, response)
    }
    )
    .catch((error) => {
      callback(error);
    });;
}