'use strict';
require('./bootstrap.js');

const DEFAULTS = global.DEFAULTS;
const sinon = global.sinon;
const expect = global.expect;
const Bluebird = require('bluebird');
const LocalPubSub = require('@freshkeep/eventhandler2').LocalPubSub;
const AWSIoTEventPublisher = require('../../lib/aws_iot_publisher.js');
const AWS = require('aws-sdk');
const iot = new AWS.Iot({
    endpoint: DEFAULTS.awsIoT.endpointIot,
    region: DEFAULTS.awsIoT.region,
});
const uuidv4 = require('uuid/v4');
const awsIotDevice = require('aws-iot-device-sdk');

describe('AWS IoT Publisher tests ->', function() {
    this.timeout(20000);
    let localPubSub;
    let sandbox = sinon.createSandbox();
    let awsIotPublisher;
    const iotdata = new AWS.IotData({
        endpoint: DEFAULTS.awsIoT.endpointData,
        region: DEFAULTS.awsIoT.region
    });

    let thingName;
    let device;
    before(async () => {
        thingName = uuidv4();
        await createThing(thingName);
        device = getIotDevice();
        device.on('offline', () => {});
        device.on('close', () => {});
        device.on('error', () => {});
    });

    beforeEach(() => {
        localPubSub = new LocalPubSub();
        awsIotPublisher = new AWSIoTEventPublisher(localPubSub, iotdata);
    });

    afterEach(() => {
        sandbox.restore();
    });

    after(async() => {
        device.end(false);
        await Bluebird.delay(5000);
        await destroyThing(thingName);
    });

    it('_publishToTopic is expected to publish a message to a thing topic and received by thing', async () => {
        let mockTopic = `/outgoing/${thingName}`
        let messageReceived = false;
        let mockMessage = 'hello world';
        let receivedMessage;
        let receivedTopic;

        device.on('connect', () => {
            console.log('connected');
        })
        device.on('message', (topic, base64Payload) => {
            receivedTopic = topic;
            receivedMessage = base64Payload;
        });

        await subscribeSync(device, mockTopic);
        await awsIotPublisher._publishToTopic(mockMessage, mockTopic);
        await Bluebird.delay(500);
        expect(receivedMessage).to.be.not.undefined;
        expect(receivedMessage.toString('utf-8')).to.be.eq(mockMessage);
        expect(receivedTopic).to.be.eq(mockTopic);
    });
});

function subscribeSync(device, mockTopic) {
    return new Promise((resolve, reject) => {
        device.subscribe(mockTopic, {
            qos: 1
        }, (err, granted) => {
            if (err) return reject(err)
            resolve(granted);
        });
    });

}

async function createThing(thingName) {
    return iot.createThing(
        {
            thingName: thingName
        }
    ).promise();
}

async function destroyThing(thingName) {
    return iot.deleteThing(        {
        thingName: thingName
    }).promise();
}

function getIotDevice(thingName) {
    return awsIotDevice.device({
        clientId: thingName,
        protocol: 'wss',
        region: DEFAULTS.awsIoT.region,
        host: DEFAULTS.awsIoT.deviceClientHost
    });
}