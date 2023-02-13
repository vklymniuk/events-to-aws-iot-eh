'use strict';

const EventHandler = require('@vklymniuk/event-handler').EventHandler;
const DEFAULTS = global.DEFAULTS;
const MOBILE_WEB_EVENTS_TOPIC_PREFIX = 'events/mobileweb';
const DEVICE_EVENTS_TOPIC_PREFIX = 'events/device';
const BROADCAST_MODE = 'BROADCAST';
const P2P_MODE = 'P2P';
const DEVICES_TARGET = 'DEVICES';
const MOBILE_WEB_TARGET = 'MOBILE_WEB';

class AWSIoTPublisher extends EventHandler {

    constructor(iPubSub, iotDataClient) {
        super(iPubSub);
        this._iotDataClient = iotDataClient;
        this._mode = DEFAULTS.destination.mode;
        this._target = DEFAULTS.destination.target;

        this._validateParameters();
    }

    _validateParameters() {
        if (!this._mode || !this._target) {
            let message = 'Mode and Target must be set via config.json or ENV variables';
            console.error(message);

            throw new Error(message);
        }

        if (this._mode !== BROADCAST_MODE && this._mode !== P2P_MODE) {
            let message = `Mode must be set to either ${BROADCAST_MODE} or ${P2P_MODE}`;
            console.error(message);

            throw new Error(message);
        }

        if (this._target !== DEVICES_TARGET && this._target !== MOBILE_WEB_TARGET) {
            let message = `Target must be set to either ${DEVICES_TARGET} or ${MOBILE_WEB_TARGET}`
            console.error(message);

            throw new Error(message);
        }
    }

    _initEventHandlers() {
        this.registerEventHandler('ANY', this._publishEventToAWSIot.bind(this));
    }

    _publishEventToAWSIot(ctx) {
        let message = `Prepare message to publish in topic.`;
        let event = ctx.EVENT;
        let topic = this._getEventPublishTopic(event);
        console.info(message, { "message": JSON.stringify(event), "text": message, "event": event, "topic": topic, });

        return this._publishToTopic( JSON.stringify(event), topic );
    }

    _getEventPublishTopic(event) {
        let topic = this._getTargetTopicPrefix();

        switch (this._mode) {
            case BROADCAST_MODE:
                return topic += `/${event.GROUP_ID}`;
            case P2P_MODE:
                return topic += this._getP2PTopicSuffix(event);
        }
    }

    _getTargetTopicPrefix() {
        if (this._target == DEVICES_TARGET) {
            return DEVICE_EVENTS_TOPIC_PREFIX;
        }

        if (this._target == MOBILE_WEB_TARGET) {
            return MOBILE_WEB_EVENTS_TOPIC_PREFIX;
        }
    }

    _getP2PTopicSuffix(event) {
        if (this._target == DEVICES_TARGET) {
            return `/${event.DEVICE_ID}`;
        }

        if (this._target == MOBILE_WEB_TARGET) {
            return `/${event.USER_ID}`;
        }
    }

    _publishToTopic(message, topic) {
        try {   
            return this._iotDataClient.publish({ topic: topic, payload: message, qos: 1 }).promise();
        } catch (err) {
            console.error(err.message, {
                  topic: topic,
                  payload: message,
                  qos: 1
            });
        
            throw err;
        }
    }
}

module.exports = AWSIoTPublisher;
