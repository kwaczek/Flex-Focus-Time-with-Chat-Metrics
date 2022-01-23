import { FlexPlugin } from 'flex-plugin';

import { setupWindowState } from './helpers/windowStateSetup';
import { logHandleTime, calculateHandlTime, writeHandleTime, handleOnDisconnectVoiceClient, writeAcceptTime } from './helpers/logHandleTime';


const PLUGIN_NAME = 'FlexInsightsChatPlugin';

export default class FlexInsightsChatPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  async init(flex, manager) {
    setupWindowState(manager.store);

    flex.Actions.addListener("beforeSelectTask", payload => logHandleTime(payload, manager.store));
    flex.Actions.addListener("afterAcceptTask", payload => writeAcceptTime(payload));
    flex.Actions.addListener("afterWrapupTask", payload => calculateHandlTime(payload, true));
    flex.Actions.addListener("beforeCompleteTask", async payload => writeHandleTime(payload, manager.store))
    flex.Manager.getInstance().voiceClient.on('disconnect', payload => handleOnDisconnectVoiceClient(payload, manager))
  }
}
