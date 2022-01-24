// configure where the focus time is stored
const FOCUSTIMEATTRIBUTE = 'focus_time'

// configure domain for the serverless function
const RUNTIMEDOMAIN = "https://flex-insights-service-XXXX-dev.twil.io"

// list all chat-like channels for the additional metrics (first response time, average response time ...)
const CHANNELS = ['chat'] 

// enable or disable additional features for chat-like channels
// if enable then pick metric attribute from the Twilio documenttion - https://www.twilio.com/docs/flex/developer/insights/enhance-integration#add-custom-attributes-and-measures
// if disable then use null (ie. agentMessages: null)
const FEATURES = {
    firstAgentResponse : 'first_response_time',
    averageResponseTime: 'average_response_time',
    agentMessages: 'conversation_measure_2',
    customerMessages: 'conversation_measure_3',
    averageAgentLength: 'conversation_measure_4',
    averageCustomerLength: 'conversation_measure_6'
}

// configuration done

export const getConfig = () => {
    let configuredFeatures = ''
    for (const feature in FEATURES) {
        (FEATURES[feature] != null) ? configuredFeatures += '1' : configuredFeatures += '0'
        }
    return configuredFeatures
};

export { CHANNELS, FEATURES, RUNTIMEDOMAIN, FOCUSTIMEATTRIBUTE } ;
