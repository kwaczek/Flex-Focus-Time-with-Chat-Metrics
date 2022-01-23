# Flex Focus Time with Chat Metrics

![alt text](readme_images/chat_insights.png)

# Overview

Flex plugin to measure focus time and additional metrics for chat related channels. All metrics are sent via taskrouter to Flex Insights.

# Focus Time

Focus Time is a metric that measures time spent on each reservation. In a multi-tasking scenario where an Agent is working 
multiple interactions at the same time, this plugin will track the "in focus" time for each task instead of just the task duration. 
The logging stops as soon as the task enters the Wrapup state. Unlike in https://github.com/lehel-twilio/plugin-handleTimeTracker, this plugin is using
browser local storage, so it's resilient against browser refreshes.

![alt text](readme_images/multiple_reservaitions.png)

The focus time is calculated for all channels and by default, the **conversation_measure_1** is used for Flex Insights.
   
# Additional Chat Metrics

Together with the Focus Time, there are additional metrics that can be enabled for chat-like channels:

### First Response Time

* duration in seconds between a reservation is accepted and first message is sent by agent
* by default **first_response_time** atribute is used for Flex Insights

### Average Response Time

* average duration in seconds between customer message and agent's first following message
* first agent's message duration is excluded, because it would include queue time (customer sends first message > waiting in queue > agent accept reservation > first message sent)

### Number of Agent Messages

* count how many messages sent by Agent

### Number of Customer Messages

* count how many messages sent by Customer
* if there is transfer or longlived channels configured then the function needs to be enhanced to exclude other agent(s) too

### Average Length of Agent's Messages

* average number of characters in agent's messages

### Average Length of Customer's Messages

* average number of characters in customer's messages
* if there is transfer or longlived channels configured then the function needs to be enhanced to exclude other agent(s) too


