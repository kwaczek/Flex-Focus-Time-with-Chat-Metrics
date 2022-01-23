//// config
const FOCUSTIMEATTRIBUTE = 'conversation_measure_1'

const RUNTIMEDOMAIN = "http://localhost:3000" //configure domain for the serverless function

const CHANNELS = ['chat'] //list all channels for additional metrics (first response time, average response time ...)

const FEATURES = {
    firstAgentResponse : 'first_response_time',
    averageResponseTime: 'average_response_time',
    agentMessages: 'conversation_measure_2',
    customerMessages: 'conversation_measure_3',
    averageAgentLength: 'conversation_measure_4',
    averageCustomerLength: 'conversation_measure_6'
}

export const getConfig = () => {
    let configuredFeatures = ''
    for (const feature in FEATURES) {
        (FEATURES[feature] != null) ? configuredFeatures += '1' : configuredFeatures += '0'
        }
    return configuredFeatures
};

export { CHANNELS, FEATURES, RUNTIMEDOMAIN, FOCUSTIMEATTRIBUTE } ;
