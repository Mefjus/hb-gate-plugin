import * as dotenv from 'dotenv';
import {
    Accessory,
    Categories,
    Characteristic,
    CharacteristicEventTypes, CharacteristicGetCallback, CharacteristicSetCallback,
    CharacteristicValue,
    Service,
    uuid
} from "hap-nodejs";
import rpio from 'rpio'

dotenv.config();

const GATE_SIGNAL = Number(process.env.GATE_SIGNAL) || -1;
const GATE_POWER = Number(process.env.GATE_POWER) || -1;


const accessoryUuid = uuid.generate("hap.gate");
const accessory = new Accessory(process.env.ACCESSORY_NAME ?? "Example Accessory Name", accessoryUuid);

const gateService = new Service.GarageDoorOpener(process.env.ACCESSORY_NAME ?? "Example Service");

let gateState: CharacteristicValue = Characteristic.CurrentDoorState.CLOSED;

rpio.open(GATE_SIGNAL, rpio.OUTPUT, rpio.LOW)
rpio.open(GATE_POWER, rpio.OUTPUT, rpio.HIGH)

const currentCharacteristic  = gateService.getCharacteristic(Characteristic.CurrentDoorState)
    .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        callback(undefined, gateState);
    });

const targetCharacteristic = gateService.getCharacteristic(Characteristic.TargetDoorState)
    .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        callback(undefined, gateState);
    }).on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        rpio.write(GATE_SIGNAL, rpio.HIGH);
        gateState = Characteristic.CurrentDoorState.OPENING;
        updateGateState()


        setTimeout(() => {
            rpio.write(GATE_SIGNAL, rpio.LOW)
            gateState = Characteristic.CurrentDoorState.CLOSED;
            updateGateState();
        }, 1000)

        callback()
});

const updateGateState = () => {
    currentCharacteristic.updateValue(gateState)
    targetCharacteristic.updateValue(gateState)
}


gateService.getCharacteristic(Characteristic.ObstructionDetected)
    .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        callback(undefined,false) ;
});


accessory.addService(gateService);

accessory.publish({
    username: "18:51:07:F4:BC:6A",
    pincode: "111-11-111",
    port: 47120,
    category: Categories.GARAGE_DOOR_OPENER,
});

console.log("Accessory setup finished!");