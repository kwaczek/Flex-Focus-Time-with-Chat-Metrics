# Overview

Flex plugin to measure focus time and additional metrics for chat related channels. 

# Focus Time

Focus Time is a metric that measures time spent on each reservation. In a multi-tasking scenario where an Agent is working 
multiple interactions at the same time, this plugin will track the "in focus" time for each task instead of just the task duration. 
The logging stops as soon as the task enters the Wrapup state. Unlike in https://github.com/lehel-twilio/plugin-handleTimeTracker, this plugin is using
browser local storage, so it's resilient against browser refreshes.


   
# Prerequisites

* Raise a support request to get credentials for a new account for your Insights Workspace
* This account should only have the role of wfo.flex_dashboard_viewer
* Proceed further once you have the loginid, password and insights account id
