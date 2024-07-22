import {useEffect, useState, useRef} from 'react';
import { invoke } from "@tauri-apps/api/tauri";
import { BaseDirectory, createDir, readTextFile, writeTextFile, exists } from "@tauri-apps/api/fs";
import { appDataDir, appDir } from '@tauri-apps/api/path';
import "./App.css";
import { appWindow } from '@tauri-apps/api/window';
import paddockLogo from "./assets/paddock-logo.png";
import axisTab from "./assets/axis-tab.png";
import effectTab from "./assets/effect-tab.png";
import steeringWheel from "./assets/steering-wheel.png";
import steeringWheelActive from "./assets/steering-wheel-active.png";
import steeringWheelTitle from "./assets/steering-wheel-angle-title.png";
import { getVersion } from '@tauri-apps/api/app';

const appVersion = await getVersion();

function App() {
    const [sliderPowerValue, setSliderPowerValue] = useState(50);
    const [sliderIntensityValue, setSliderIntensityValue] = useState(50);
    const [sliderDegreesValue, setSliderDegreesValue] = useState(540);
    const [sliderBumpstopValue, setSliderBumpstopValue] = useState(50);
    const [sliderMechanicalDamperValue, setSliderMechanicalDamperValue] = useState(50);
    const [sliderIdleSpringValue, setSliderIdleSpringValue] = useState(50);
    const [sliderDamperValue, setSliderDamperValue] = useState(50);
    const [sliderSpringValue, setSliderSpringValue] = useState(50);
    const [sliderFrictionValue, setSliderFrictionValue] = useState(50);
    const [sliderInertiaValue, setSliderInertiaValue] = useState(50);
    const [sliderFilterFreqValue, setSliderFilterFreqValue] = useState(250);
    const [sliderFilterQValue, setSliderFilterQValue] = useState(40);
    const [rotation, setRotation] = useState(0);
    const [profiles, setProfiles] = useState({});
    const [currentPage, setCurrentPage] = useState('main');
    const [status, setStatus] = useState('Disconnected');
    const [connectedDevice, setConnectedDevice] = useState('');
    const [message, setMessage] = useState('');
    const [newProfileName, setNewProfileName] = useState('');
    const [profileChanged, setProfileChanged] = useState(false);
    const [encoderRatio, setEncoderRatio] = useState(1.0);
    const [angleRatio, setAngleRatio] = useState(1.0);
    const [reload, setReload] = useState(0);
    const newProfileInputRef = useRef(null);
    const advancedSettingsEncoderRatioInputRef = useRef(null);
    const [firstConnect, setFirstConnect] = useState(true);
    const [calibrationRightDone, setCalibrationRightDone] = useState(false);
    const [calibrationLeftDone, setCalibrationLeftDone] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });
    const [degreesTooltipVisible, setDegreesTooltipVisible] = useState(false);
    const [powerTooltipVisible, setPowerTooltipVisible] = useState(false);
    const [intensityTooltipVisible, setIntensityTooltipVisible] = useState(false);
    const [bumpstopTooltipVisible, setBumpstopTooltipVisible] = useState(false);
    const [idlespringTooltipVisible, setIdlespringTooltipVisible] = useState(false);
    const [mechanicaldamperTooltipVisible, setMechanicaldamperTooltipVisible] = useState(false);
    const [damperTooltipVisible, setDamperTooltipVisible] = useState(false);
    const [springTooltipVisible, setSpringTooltipVisible] = useState(false);
    const [frictionTooltipVisible, setFrictionTooltipVisible] = useState(false);
    const [inertiaTooltipVisible, setInertiaTooltipVisible] = useState(false);
    const [filterfreqTooltipVisible, setFilterfreqTooltipVisible] = useState(false);
    const [filterqTooltipVisible, setFilterqTooltipVisible] = useState(false);
    
    const defaultConfig = {
        encoderRatio: 1.0,
        angleRatio: 1.0,
    }

    const defaultProfiles = {
                    current: "Default",
                    profiles: [{
                        name: "Default",
                        degrees: 540,
                        power: 50,
                        intensity: 50,
                        bumpstop: 50,
                        idlespring: 50,
                        mechanicaldamper: 50,
                        damper: 50,
                        spring: 50,
                        friction: 50,
                        inertia: 50,
                        filtefreq: 250,
                        filterq: 50,
                    }],
    }

    const prepareDataDirectory = async () => {
      await createDir("data", {
        dir: BaseDirectory.Desktop,
        recursive: true,
      });
    }

    const onProfileNameChange = (e) => {
        setNewProfileName(e.target.value);
    }


    const deleteCurrentProfile = () => {
        let obj = Object.assign({}, profiles);
        for (let i in Object.keys(obj.profiles)) {
            if (obj.profiles && obj.profiles[i] && obj.profiles[i].name === profiles.current) {
                obj.profiles.splice(i, 1);
            }
        }
        obj.current = 'Default';
        setProfiles(obj);
        applyProfile(obj.profiles[0]);
        syncProfileData(obj);

        setCurrentPage('main');
    }

    const saveNewProfile = () => {
                        let newProfile = Object.assign({}, profiles.profiles[0]);
                        newProfile.name = newProfileName;
                        let obj = Object.assign({}, profiles);
                        let found = false;
        for (let i in Object.keys(obj.profiles)) {
            if (obj.profiles[i].name === newProfileName) {
                found = true;
            }
        }
        if (found) {
            alert('The profile with the same name is already exist!');
            return;
        }


                        obj.profiles.push(newProfile);
                        obj.current = newProfileName;
                        setProfiles(obj);
                        applyProfile(newProfile);
                        setCurrentPage('main');
                        syncProfileData(obj);
    }

    const applyProfile = async (profile) => {
        const keys = Object.keys(profile);
        for (let i in keys) {
            let key = keys[i];
            if (key === 'name' || key === '') { // This could cause crash in Rust side.
                continue;
            }
            let value = profile[key];
            let input = key + ":" + value
            if (key === 'degrees') {
                let adjustedValue = value * angleRatio;
                input = key + ":" + adjustedValue
            }
            // Apply
            await invoke("set_value", { input });

            // Update the UI
            switch (key) {
            case "power":
                setSliderPowerValue(value);
                break;
            case "intensity":
                setSliderIntensityValue(value);
                break;
            case "degrees":
                setSliderDegreesValue(value);
                break;
            case "bumpstop":
                setSliderBumpstopValue(value);
                break;
            case "idlespring":
                setSliderIdleSpringValue(value);
                break;
            case "mechanicaldamper":
                setSliderMechanicalDamperValue(value);
                break;
            case "damper":
                setSliderDamperValue(value);
                break;
            case "spring":
                setSliderSpringValue(value);
                break;
            case "friction":
                setSliderFrictionValue(value);
                break;
            case "inertia":
                setSliderInertiaValue(value);
                break;
            case "filterfreq":
                setSliderFilterFreqValue(value);
                break;
            case "filterq":
                setSliderFilterQValue(value);
                break;
            default:
                break;
            }
        }
        setCurrentPage('main');
    }

    const syncProfileData = async (data) => {
        await prepareDataDirectory()

        const appDirectory = await appDataDir();
        const filePath = appDirectory + `profiles.json`
        try {
            const fileExists = await exists(filePath);
            if (!fileExists) {
                setProfiles(defaultProfiles);
                applyProfile(defaultProfiles.profiles[0]);
                let content = JSON.stringify(defaultProfiles);
                await writeTextFile(
                    {
                        contents: content,
                        path: filePath,
                    }
                );
            } else {
                if (!data) {
                    const content = await readTextFile(filePath);
                    const existing = JSON.parse(content);
                    if (existing && existing.profiles && existing.profiles.length > 0 && existing.profiles[0].name === 'Default') {
                        setProfiles(existing);
                        for (let i in Object.keys(existing.profiles)) {
                            if (existing.profiles[i].name === existing.current) {
                                applyProfile(existing.profiles[i]);
                                break;
                            }
                        }
                    } else {
                        setProfiles(defaultProfiles);
                        applyProfile(defaultProfiles.profiles[0]);
                    }
                } else {
                    let obj = Object.assign({}, data);
                    let content = JSON.stringify(obj);
                    await writeTextFile(
                    {
                        contents: content,
                        path: filePath,
                    }
                    );
                }
            }
        } catch (e) {
            console.log(e);
        }
    };

    const syncConfigData = async (data) => {
        await prepareDataDirectory()

        const appDirectory = await appDataDir();
        const filePath = appDirectory + `config.json`
        try {
            const fileExists = await exists(filePath);
            if (!fileExists) {
                setProfiles(defaultConfig);
                let content = JSON.stringify(defaultConfig);
                await writeTextFile(
                    {
                        contents: content,
                        path: filePath,
                    }
                );
            } else {
                if (!data) {
                    const content = await readTextFile(filePath);
                    const existing = JSON.parse(content);
                    if (existing) {
                        let existingEncoderRatio = parseFloat(existing.encoderRatio);
                        if (existingEncoderRatio <= 0) existingEncoderRatio = 1.0;
                        setEncoderRatio(existingEncoderRatio);
                        let existingAngleRatio = parseFloat(existing.angleRatio);
                        if (existingAngleRatio <= 0) existingAngleRatio = 1.0;
                        setAngleRatio(existingAngleRatio);
                    } else {
                        setEncoderRatio(1.0);
                        setAngleRatio(1.0);
                    }
                } else {
                    let obj = Object.assign({}, data);
                    let content = JSON.stringify(obj);
                    await writeTextFile(
                    {
                        contents: content,
                        path: filePath,
                    }
                    );
                }
            }
        } catch (e) {
            console.log(e);
        }
    };

    const readDeviceEncoder = async (e) => {
        let degs = await invoke("read_device_encoder");
        degs = degs / encoderRatio;
        let floored = Math.floor(degs)
        setRotation(floored);
    }

    const setCenterPosition = async (e) => {
        let input = "center" + ":0";
        await invoke("set_value", { input });
    }

    const saveProfile = async () => {
        let toBeSaved = {
                        name: profiles.current,
                        degrees: sliderDegreesValue,
                        power: sliderPowerValue,
                        intensity: sliderIntensityValue,
                        bumpstop: sliderBumpstopValue,
                        idlespring: sliderIdleSpringValue,
                        mechanicaldamper: sliderMechanicalDamperValue,
                        damper: sliderDamperValue,
                        spring: sliderSpringValue,
                        friction: sliderFrictionValue,
                        inertia: sliderInertiaValue,
                        filtefreq: sliderFilterFreqValue,
                        filterq: sliderFilterQValue,
        }
        let obj = Object.assign({}, profiles);
        for (let i in Object.keys(obj.profiles)) {
            if (obj.profiles[i].name === toBeSaved.name) {
                obj.profiles[i] = toBeSaved;
                break;
            }
        }
        setProfileChanged(false);
        syncProfileData(obj);
    }

    const handleWheel = (e) => {
        let currentValue = 0;
        switch (e.target.id) {
            case "power":
                currentValue = sliderPowerValue;
                break;
            case "intensity":
                currentValue = sliderIntensityValue;
                break;
            case "degrees":
                currentValue = sliderDegreesValue;
                break;
            case "bumpstop":
                currentValue = sliderBumpstopValue;
                break;
            case "idlespring":
                currentValue = sliderIdleSpringValue;
                break;
            case "mechanicaldamper":
                currentValue = sliderMechanicalDamperValue;
                break;
            case "damper":
                currentValue = sliderDamperValue;
                break;
            case "spring":
                currentValue = sliderSpringValue;
                break;
            case "friction":
                currentValue = sliderFrictionValue;
                break;
            case "inertia":
                currentValue = sliderInertiaValue;
                break;
            case "filterfreq":
                currentValue = sliderFilterFreqValue;
                break;
            case "filterq":
                currentValue = sliderFilterQValue;
                break;
            default:
                break;
        }

        console.log(e);
        console.log(e.deltaY);
        console.log(currentValue);
        if (e.deltaY > 0) {
            if (e.target.id === 'degrees') {
                currentValue = parseFloat(currentValue) + 5
            } else {
                currentValue = parseFloat(currentValue) + 1
            }
        } else {
            if (e.target.id === 'degrees') {
                currentValue = parseFloat(currentValue) - 5
            } else {
                currentValue = parseFloat(currentValue) - 1
            }
        }
        console.log(currentValue);
        if (e.target.id === 'degrees') {
            currentValue = Math.max(0, Math.min(1440, currentValue));
        } else if (e.target.id === 'filterfreq') {
            currentValue = Math.max(0, Math.min(50, currentValue));
        } else if (e.target.id === 'filterq') {
            currentValue = Math.max(0, Math.min(80, currentValue));
        } else {
            currentValue = Math.max(0, Math.min(100, currentValue));
        }
        e.target.value = currentValue;
        updateSliderValue(e);
    };

    const updateSliderValue = async (e) => {
        setProfileChanged(true);
        let input = e.target.id + ":" + e.target.value;
        switch (e.target.id) {
            case "power":
                setSliderPowerValue(e.target.value);
                break;
            case "intensity":
                setSliderIntensityValue(e.target.value);
                break;
            case "degrees":
                let value = e.target.value * angleRatio;
                input = e.target.id + ":" + value;
                setSliderDegreesValue(e.target.value);
                break;
            case "bumpstop":
                setSliderBumpstopValue(e.target.value);
                break;
            case "idlespring":
                setSliderIdleSpringValue(e.target.value);
                break;
            case "mechanicaldamper":
                setSliderMechanicalDamperValue(e.target.value);
                break;
            case "damper":
                setSliderDamperValue(e.target.value);
                break;
            case "spring":
                setSliderSpringValue(e.target.value);
                break;
            case "friction":
                setSliderFrictionValue(e.target.value);
                break;
            case "inertia":
                setSliderInertiaValue(e.target.value);
                break;
            case "filterfreq":
                setSliderFilterFreqValue(e.target.value);
                break;
            case "filterq":
                setSliderFilterQValue(e.target.value);
                break;
            default:
                break;
        }
        await invoke("set_value", { input });
    };

    const showTooltip = (e) => {
        if (e && e.target && e.target.id === 'degrees-tooltip') {
            setDegreesTooltipVisible(true);
        }
        if (e && e.target && e.target.id === 'power-tooltip') {
            setPowerTooltipVisible(true);
        }
        if (e && e.target && e.target.id === 'intensity-tooltip') {
            setIntensityTooltipVisible(true);
        }
        if (e && e.target && e.target.id === 'bumpstop-tooltip') {
            setBumpstopTooltipVisible(true);
        }
        if (e && e.target && e.target.id === 'mechanicaldamper-tooltip') {
            setMechanicaldamperTooltipVisible(true);
        }
        if (e && e.target && e.target.id === 'idlespring-tooltip') {
            setIdlespringTooltipVisible(true);
        }
        if (e && e.target && e.target.id === 'damper-tooltip') {
            setDamperTooltipVisible(true);
        }
        if (e && e.target && e.target.id === 'spring-tooltip') {
            setSpringTooltipVisible(true);
        }
        if (e && e.target && e.target.id === 'friction-tooltip') {
            setFrictionTooltipVisible(true);
        }
        if (e && e.target && e.target.id === 'inertia-tooltip') {
            setInertiaTooltipVisible(true);
        }
        if (e && e.target && e.target.id === 'filterfreq-tooltip') {
            setFilterfreqTooltipVisible(true);
        }
        if (e && e.target && e.target.id === 'filterq-tooltip') {
            setFilterqTooltipVisible(true);
        }
    };

    const hideTooltip = () => {
        setDegreesTooltipVisible(false);
        setPowerTooltipVisible(false);
        setIntensityTooltipVisible(false);
        setMechanicaldamperTooltipVisible(false);
        setIdlespringTooltipVisible(false);
        setBumpstopTooltipVisible(false);
        setDamperTooltipVisible(false);
        setSpringTooltipVisible(false);
        setFrictionTooltipVisible(false);
        setInertiaTooltipVisible(false);
        setFilterfreqTooltipVisible(false);
        setFilterqTooltipVisible(false);
    };

    const updateTooltipPosition = (e) => {
        setTooltipPosition({ left: e.clientX+170, top: e.clientY });
    };

    const calibrate = async () => {
        setCurrentPage('calibration');
        let input = 'power:15'
        await invoke("set_value", { input });
        input = 'degrees:360'
        await invoke("set_value", { input });
        input = 'idlespring:100'
        await invoke("set_value", { input });
    }

    const exitCalibration = async () => {
        setFirstConnect(false);
        syncProfileData(null);
        setCurrentPage('main');
    }

    const getDevices = async () => {
        let device = await invoke("get_device");
        if (device && device.message && device.message.length > 0) {
            if (device.message === 'Access is denied.') {
                setMessage("Device is already being used by other app. Access is denied.");
                setStatus('')
                return;
            }
        }
        if (device && device.port && device.port.length > 0) {
                if (firstConnect) {
                    calibrate();
                }
                setStatus('Connected')
                setConnectedDevice(device.port);
                setMessage('');

        } else {
                setStatus('Disconnected');
                setConnectedDevice('');
                setMessage('');
        }
    }

    const closeApp = async () => {
        appWindow.close();
    }

    const minimizeApp = async () => {
        appWindow.minimize();
    }

    useEffect(() => {
        if (rotation > 160) {
            setCalibrationRightDone(true);
        }
        if (rotation < -160) {
            setCalibrationLeftDone(true);
        }
    }, [rotation])
    useEffect(() => {
        appWindow.setResizable(false);
        appWindow.setTitle('RPS Paddock')

        syncProfileData(null);
        syncConfigData(null);

        const readDeviceEncoderInterval = setInterval(() => {
            readDeviceEncoder();
        }, 50);

        const getDeviceInterval = setInterval(() => {
            getDevices();
        }, 500);

        return () => {
            clearInterval(getDeviceInterval);
            clearInterval(readDeviceEncoderInterval);
        }
    }, [status, reload, firstConnect])

    const RenderProfiles = ({ profiles }) => {
        const keys = Object.keys(profiles.profiles).filter(key => key !== "current");

        return (
        <ul>
            {keys.map(key => (
            <li className="profile-item" key={key}
                onClick={() => {
                    applyProfile(profiles.profiles[key]);
                    let obj = Object.assign({}, profiles);
                    obj.current = profiles.profiles[key].name;
                    setProfiles(obj);
                    syncProfileData(obj);
                    setProfileChanged(false);
                }}
            >
                {profiles.profiles[key].name}
            </li>
            ))}
        </ul>
        );
    };

    return (
        <div id="app">
	        <div className="titlebar" data-tauri-drag-region>
                <div id="titlebar-buttons">
                    <button className="titlebar-button" id="close" onClick={closeApp}>×</button>
                    <button className="titlebar-button" id="minimize" onClick={minimizeApp}>−</button>
                </div>
                {/**
                {firstConnect ? 'firstConncet true' : 'firstConnect false'}<br/>
                 */}
                <div className="title" data-tauri-drag-region>
                    <img src={paddockLogo} width="300" data-tauri-drag-region/>
                    <span style={{fontSize:11}}>&nbsp;v{appVersion}</span>
	    	    <div className="device-box" data-tauri-drag-region>
                <div className="status" data-tauri-drag-region>
                {status=='Connected' ? (
                    <div className="connected-indicator" data-tauri-drag-region></div>
                ) : (
                    <div className="disconnected-indicator" data-tauri-drag-region></div>
                )}
	    	    {status} 
                    {connectedDevice && connectedDevice.length > 0 && (
                        <span data-tauri-drag-region> ({connectedDevice})</span>
                    )}
                    {message && message.length > 0 && (
                        <span data-tauri-drag-region> {message}</span>
                    )}
                </div>
	    	    </div>
                </div>
            </div>
            {currentPage === 'main' && (
            <div className="content">
                <div className="col-axis">
	    	    <img src={axisTab} style={{height:30, align:'right'}}/>
                    <div className="slider-container">
                        <div id="slider-value" className="slider-value">
                            <div id="degrees-tooltip" onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onMouseMove={updateTooltipPosition}>
                                Steering Angle
                                <span style={{float:'right', marginRight:30}}>{sliderDegreesValue}°</span>
                            </div>
                        </div>
                        {degreesTooltipVisible && (
                            <div className="tooltip" style={{ left: tooltipPosition.left, top: tooltipPosition.top }}>
                                This setting determines how far the steering wheel can be turned to the left or right, affecting the vehicle's turning radius and responsiveness.
                            </div>
                        )}
                        <input
                            id="degrees"
                            onWheel={handleWheel}
                            disabled={!(connectedDevice && connectedDevice.length > 0)}
                            className={(connectedDevice && connectedDevice.length > 0) ? 'slider' : 'slider-disabled'}
                            type="range"
                            min="90"
                            max="1440"
                            step="5"
                            value={sliderDegreesValue}
                            onChange={updateSliderValue}
                        />
                    </div>
                    <div className="slider-container">
                        <div id="slider-value" className="slider-value">
                            <div id="power-tooltip" onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onMouseMove={updateTooltipPosition}>
                                Power
                                <span style={{float:'right', marginRight:30}}>{sliderPowerValue}%</span>
                            </div>
                        </div>
                        {powerTooltipVisible && (
                            <div className="tooltip" style={{ left: tooltipPosition.left, top: tooltipPosition.top }}>
                                Adjusting the force feedback power changes how strongly the steering wheel resists or reacts to these simulated forces.
                            </div>
                        )}
                        <input
                            id="power"
                            onWheel={handleWheel}
                            disabled={!(connectedDevice && connectedDevice.length > 0)}
                            className={(connectedDevice && connectedDevice.length > 0) ? 'slider' : 'slider-disabled'}
                            type="range"
                            min="0"
                            max="100"
                            value={sliderPowerValue}
                            onChange={updateSliderValue}
                        />
                    </div>
                    <div className="slider-container">
                        <div id="slider-value" className="slider-value">
                            <div id="intensity-tooltip" onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onMouseMove={updateTooltipPosition}>
                                Intensity
                                <span style={{float:'right', marginRight:30}}>{sliderIntensityValue}</span>
                            </div>
                        </div>
                        {intensityTooltipVisible && (
                            <div className="tooltip" style={{ left: tooltipPosition.left, top: tooltipPosition.top }}>
                                Higher intensity settings offer more pronounced and detailed feedback, enhancing the realism and immersive experience, while lower intensity settings provide a gentler and less detailed feedback.
                            </div>
                        )}
                        <input
                            id="intensity"
                            onWheel={handleWheel}
                            disabled={!(connectedDevice && connectedDevice.length > 0)}
                            className={(connectedDevice && connectedDevice.length > 0) ? 'slider' : 'slider-disabled'}
                            type="range"
                            min="0"
                            max="100"
                            value={sliderIntensityValue}
                            onChange={updateSliderValue}
                        />
                    </div>
                    <div className="slider-container">
                        <div id="slider-value" className="slider-value">
                            <div id="bumpstop-tooltip" onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onMouseMove={updateTooltipPosition}>
                                Bumpstop <span style={{float:'right', marginRight:30}}>{sliderBumpstopValue}</span>
                            </div>
                        </div>
                        {bumpstopTooltipVisible && (
                            <div className="tooltip" style={{ left: tooltipPosition.left, top: tooltipPosition.top }}>
                                A physical or software-based limit that prevents the steering wheel from rotating beyond a certain angle. The higher the value, the more it will resists against force from your hands.
                            </div>
                        )}
                        <input
                            id="bumpstop"
                            onWheel={handleWheel}
                            disabled={!(connectedDevice && connectedDevice.length > 0)}
                            className={(connectedDevice && connectedDevice.length > 0) ? 'slider' : 'slider-disabled'}
                            type="range"
                            min="0"
                            max="100"
                            value={sliderBumpstopValue}
                            onChange={updateSliderValue}
                        />
                    </div>
                    <div className="slider-container">
                        <div id="slider-value" className="slider-value">
                            <div id="idlespring-tooltip" onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onMouseMove={updateTooltipPosition}>
                                Idle Spring <span style={{float:'right', marginRight:30}}>{sliderIdleSpringValue}</span>
                            </div>
                        </div>
                        {idlespringTooltipVisible && (
                            <div className="tooltip" style={{ left: tooltipPosition.left, top: tooltipPosition.top }}>
                                Centering force that applied to a force feedback steering wheel when it's not being actively used, gently returning it to the neutral position.
                            </div>
                        )}
                        <input
                            id="idlespring"
                            onWheel={handleWheel}
                            disabled={!(connectedDevice && connectedDevice.length > 0)}
                            className={(connectedDevice && connectedDevice.length > 0) ? 'slider' : 'slider-disabled'}
                            type="range"
                            min="0"
                            max="100"
                            value={sliderIdleSpringValue}
                            onChange={updateSliderValue}
                        />
                    </div>
                    <div className="slider-container">
                        <div id="slider-value" className="slider-value">
                            <div id="mechanicaldamper-tooltip" onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onMouseMove={updateTooltipPosition}>
                                Mechanical Damper <span style={{float:'right', marginRight:30}}>{sliderMechanicalDamperValue}</span>
                            </div>
                        </div>
                        {mechanicaldamperTooltipVisible && (
                            <div className="tooltip" style={{ left: tooltipPosition.left, top: tooltipPosition.top }}>
                                This effect involves physical components within the steering wheel setup, such as springs, dampers, or other mechanical parts, that provide resistance. A mechanical damper offers a more tactile and realistic feedback by physically resisting the wheel's movements, mimicking the natural damping of a real car's steering system.
                            </div>
                        )}
                        <input
                            id="mechanicaldamper"
                            onWheel={handleWheel}
                            disabled={!(connectedDevice && connectedDevice.length > 0)}
                            className={(connectedDevice && connectedDevice.length > 0) ? 'slider' : 'slider-disabled'}
                            type="range"
                            min="0"
                            max="100"
                            value={sliderMechanicalDamperValue}
                            onChange={updateSliderValue}
                        />
                    </div>
                </div>
                <div className="col-effect">
	    	    <img src={effectTab} style={{height:30, align:'left'}}/>
                    <div className="slider-container">
                        <div id="slider-value" className="slider-value">
                            <div id="damper-tooltip" onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onMouseMove={updateTooltipPosition}>
                                Damper <span style={{float:'right', marginRight:30}}>{sliderDamperValue}</span>
                            </div>
                        </div>
                        {damperTooltipVisible && (
                            <div className="tooltip" style={{ left: tooltipPosition.left, top: tooltipPosition.top }}>
                                Simulates resistance and damping effects through the force feedback system. It adjusts the electronic signals to create a sensation of smoothness and control by reducing vibrations and rapid movements.
                            </div>
                        )}
                        <input
                            id="damper"
                            onWheel={handleWheel}
                            disabled={!(connectedDevice && connectedDevice.length > 0)}
                            className={(connectedDevice && connectedDevice.length > 0) ? 'slider' : 'slider-disabled'}
                            type="range"
                            min="0"
                            max="100"
                            value={sliderDamperValue}
                            onChange={updateSliderValue}
                        />
                    </div>
                    <div className="slider-container">
                        <div id="slider-value" className="slider-value">
                            <div id="spring-tooltip" onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onMouseMove={updateTooltipPosition}>
                                Spring <span style={{float:'right', marginRight:30}}>{sliderSpringValue}</span>
                            </div>
                        </div>
                        {springTooltipVisible && (
                            <div className="tooltip" style={{ left: tooltipPosition.left, top: tooltipPosition.top }}>
                                The centering force that pulls the wheel back to the neutral position, simulating the natural return-to-center behavior of a real car's steering system.
                            </div>
                        )}
                        <input
                            id="spring"
                            onWheel={handleWheel}
                            disabled={!(connectedDevice && connectedDevice.length > 0)}
                            className={(connectedDevice && connectedDevice.length > 0) ? 'slider' : 'slider-disabled'}
                            type="range"
                            min="0"
                            max="100"
                            value={sliderSpringValue}
                            onChange={updateSliderValue}
                        />
                    </div>
                    <div className="slider-container">
                        <div id="slider-value" className="slider-value">
                            <div id="friction-tooltip" onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onMouseMove={updateTooltipPosition}>
                                Friction <span style={{float:'right', marginRight:30}}>{sliderFrictionValue}</span>
                            </div>
                        </div>
                        {frictionTooltipVisible && (
                            <div className="tooltip" style={{ left: tooltipPosition.left, top: tooltipPosition.top }}>
                                The resistance felt when turning the wheel, simulating the natural friction of a real car's steering system. It provides a more realistic steering feel by adding consistent resistance to the wheel's movements.
                            </div>
                        )}
                        <input
                            id="friction"
                            onWheel={handleWheel}
                            disabled={!(connectedDevice && connectedDevice.length > 0)}
                            className={(connectedDevice && connectedDevice.length > 0) ? 'slider' : 'slider-disabled'}
                            type="range"
                            min="0"
                            max="100"
                            value={sliderFrictionValue}
                            onChange={updateSliderValue}
                        />
                    </div>
                    <div className="slider-container">
                        <div id="slider-value" className="slider-value">
                            <div id="inertia-tooltip" onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onMouseMove={updateTooltipPosition}>
                                Inertia <span style={{float:'right', marginRight:30}}>{sliderInertiaValue}</span>
                            </div>
                        </div>
                        {inertiaTooltipVisible && (
                            <div className="tooltip" style={{ left: tooltipPosition.left, top: tooltipPosition.top }}>
                                The resistance that simulates the mass and momentum of a real car's steering system, making the wheel feel heavier and more realistic as it resists sudden changes in direction.
                            </div>
                        )}
                        <input
                            id="inertia"
                            onWheel={handleWheel}
                            disabled={!(connectedDevice && connectedDevice.length > 0)}
                            className={(connectedDevice && connectedDevice.length > 0) ? 'slider' : 'slider-disabled'}
                            type="range"
                            min="0"
                            max="100"
                            value={sliderInertiaValue}
                            onChange={updateSliderValue}
                        />
                    </div>
                    <div className="slider-container">
                        <div id="slider-value" className="slider-value">
                            <div id="filterfreq-tooltip" onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onMouseMove={updateTooltipPosition}>
                                Filter frequency<span style={{float:'right', marginRight:30}}>{sliderFilterFreqValue} Hz</span>
                            </div>
                        </div>
                        {filterfreqTooltipVisible && (
                            <div className="tooltip" style={{ left: tooltipPosition.left, top: tooltipPosition.top }}>
                                The rate (measured in hertz, Hz) at which the system processes and smooths out the force feedback signals. Higher filter frequency values result in more precise and responsive feedback, while lower values provide a smoother but potentially less detailed feel.
                            </div>
                        )}
                        <input
                            id="filterfreq"
                            onWheel={handleWheel}
                            disabled={!(connectedDevice && connectedDevice.length > 0)}
                            className={(connectedDevice && connectedDevice.length > 0) ? 'slider' : 'slider-disabled'}
                            type="range"
                            min="0"
                            max="500"
                            value={sliderFilterFreqValue}
                            onChange={updateSliderValue}
                        />
                    </div>
                    <div className="slider-container">
                        <div id="slider-value" className="slider-value">
                            <div id="filterq-tooltip" onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onMouseMove={updateTooltipPosition}>
                                Filter Q<span style={{float:'right', marginRight:30}}>{sliderFilterQValue}</span>
                            </div>
                        </div>
                        {filterqTooltipVisible && (
                            <div className="tooltip" style={{ left: tooltipPosition.left, top: tooltipPosition.top }}>
                                The quality factor of the filter used in processing force feedback signals. It determines the sharpness and precision of the filtering, affecting how well unwanted noise and vibrations are suppressed while preserving the desired feedback effects. A higher FilterQ value results in more precise filtering, while a lower value offers smoother but less detailed feedback.
                            </div>
                        )}
                        <input
                            id="filterq"
                            onWheel={handleWheel}
                            disabled={!(connectedDevice && connectedDevice.length > 0)}
                            className={(connectedDevice && connectedDevice.length > 0) ? 'slider' : 'slider-disabled'}
                            type="range"
                            min="0"
                            max="80"
                            value={sliderFilterQValue}
                            onChange={updateSliderValue}
                        />
                    </div>
                </div>
                <div className="col-angle">
	    	    <img src={steeringWheelTitle} style={{height:15, align:'left', marginTop:30}}/>
                <div style={{
                  position:'fixed',
                  zIndex: 999,
                  marginTop:131,
                  marginLeft:129,
                  width: 40,
                  textAlign:'center',
                  color: 'black'
                  }}>
                    {rotation}
                </div>
	    	    <img src={connectedDevice === '' ? steeringWheel : steeringWheelActive} 
                    style={{
                    height: 200,
                    marginTop: 40,
                    marginBottom: 30,
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                    }}
                />
                        <div style={{textAlign:'center'}}>

                        <button
                            className={'skewed-button ' + (sliderDegreesValue === '360' ? 'skewed-button-active' : '')}
                            onClick={() => {
                            setSliderDegreesValue('360');
                            updateSliderValue({target: { id: 'degrees', value: '360'}})
                            }}
                        >
                            360°
                        </button>
                        <button
                            className={'skewed-button ' + (sliderDegreesValue === '540' ? 'skewed-button-active' : '')}
                            onClick={() => {
                            setSliderDegreesValue('540');
                            updateSliderValue({target: { id: 'degrees', value: '540'}})
                            }}
                        >
                            540°
                        </button>
                        <button
                            className={'skewed-button ' + (sliderDegreesValue === '900' ? 'skewed-button-active' : '')}
                            onClick={() => {
                            setSliderDegreesValue('900');
                            updateSliderValue({target: { id: 'degrees', value: '900'}})
                            }}
                        >
                            900°
                        </button>
                        <button
                            className={'skewed-button ' + (sliderDegreesValue === '1080' ? 'skewed-button-active' : '')}
                            onClick={() => {
                            setSliderDegreesValue('1080');
                            updateSliderValue({target: { id: 'degrees', value: '1080'}})
                            }}
                        >
                            1080°
                        </button>
                        </div>
                        <br/>
                <button onClick={setCenterPosition} className="set-center-button" >Set center position</button>
                <button onClick={() => {
                    setCalibrationLeftDone(false);
                    setCalibrationRightDone(false);
                    calibrate();
                }} className="set-center-button" style={{marginLeft: 3}} >Calibrate</button>
                <br/>
                {/* 
                <button onClick={() => { setFirstConnect(true); }} className="set-center-button" >Set firstConncet to true</button>
                <button onClick={getDevices} className="set-center-button">Get device</button>
                <button onClick={readDeviceEncoder} className="set-center-button">Read device</button>
                */}
                </div>

            </div>
            )}
            {currentPage === 'about' && (
            <div className="content">
                <div className="transparent-blur" style={{height: 410, width: 950, padding: 15}}>
                    <button onClick={() => { setCurrentPage('main')}} style={{float:'left'}} className="skewed-button">Back</button>
                    <h3>About</h3>
                    <div style={{paddingLeft: 100, paddingRight: 100}}>
                    <p>
                    Our goal is to elevate the immersion of racing simulation. We provide an excellent yet affordable sim racing experience by delivering both quality hardware and endless innovations. What began as the enthusiasm of passionate DIY builders and sim racers has transformed into a well-engineered product for serious and pro sim racing gamers like you.
                    </p>
                    <p>
                    The RSR team consists of 3 individuals that are based in Indonesia.
                    </p>
                    <p>
                        <a className="skewed-button" href="https://repas-sim-racing.github.io/" target="_blank">Visit our website</a>
                    </p>
                    <p>
                        <a className="skewed-button" href="https://github.com/repas-sim-racing/rsr-paddock" target="_blank">RSR Paddock source code</a>
                    </p>
                    </div>
                </div>
            </div>
            )}
            {currentPage === 'thirdparty' && (
            <div className="content">
                <div className="transparent-blur" style={{height: 410, width: 950, padding: 15}}>
                    <button onClick={() => { setCurrentPage('main')}} style={{float:'left'}} className="skewed-button">Back</button>
                    <h3>Third-party softwares</h3>
                    <div style={{paddingLeft: 100, paddingRight: 100}}>
                    <p style={{textAlign:'left'}}>
                        We owe a great deal to the free and open-source software that helped us reach where we are today. Below, you’ll find a complete list of the software we’ve used and their license terms.
                        <ul>
                            <li>
                                OpenFFBoard (MIT) - <a className="url" href="https://github.com/Ultrawipf/OpenFFBoard" target="_blank">https://github.com/Ultrawipf/OpenFFBoard</a>
                            </li>
                            <li>
                                VESC Firmware (GPLv3) - <a className="url" href="https://github.com/vedderb/bldc" target="_blank">https://github.com/vedderb/bldc</a>
                            </li>
                            <li>
                                Tauri (MIT) - <a className="url" href="https://github.com/tauri-apps/tauri" target="_blank">https://github.com/tauri-apps/tauri</a>
                            </li>
                        </ul>
                    </p>
                    </div>
                </div>
            </div>
            )}

            {currentPage === 'profiles' && (
            <div className="content" style={{textAlign:'center !important'}}>
                <div className="transparent-blur" style={{height: 410, width: 400, padding: 15, margin: '0 auto'}}>
                    <h3>Load Profile</h3>
                    <div style={{height: 300, marginBottom: 10, background: 'black', overflowY:'auto'}}>
                        <RenderProfiles profiles={profiles}/>
                    </div>
                    <button onClick={() => { setCurrentPage('main')}} style={{float:'left'}} className="skewed-button">Cancel</button>
                </div>
            </div>
            )}

            {currentPage === 'newprofile' && (
            <div className="content" style={{textAlign:'center !important'}}>
                <div className="transparent-blur" style={{height: 200, width: 400, padding: 15, margin: '0 auto'}}>
                    <h3>Create New Profile</h3>
                    <br/>
                    <br/>
                    <input
                        className="skew"
                        placeholder="New profile name"
                        style={{paddingLeft: 10, height: 20, marginRight: 5}}
                        onChange={onProfileNameChange} 
                        onKeyDown={(e) => {
                            if (e.key == 'Enter') {
                                saveNewProfile();
                            }
                        }}
                        ref={newProfileInputRef}
                        value={newProfileName}
                    />
                    <br/>
                    <br/>
                    <br/>
                    <br/>
                    <button onClick={() => { setCurrentPage('main')}} style={{float:'left'}} className="skewed-button">Cancel</button>
                    <button
                        style={{float:'right'}}
                        onClick={saveNewProfile}
                        className="skewed-button"
                    >
                        Save
                    </button>
                </div>
            </div>
            )}

            {currentPage === 'deleteprofile' && (
            <div className="content" style={{textAlign:'center !important'}}>
                <div className="transparent-blur" style={{height: 180, width: 400, padding: 15, margin: '0 auto'}}>
                    <h3>Delete Profile</h3>
                    <br/>
                    Are you sure that you want to delete {profiles.current} profile?
                    <br/>
                    <br/>
                    <br/>
                    <br/>
                    <div>
                        <button onClick={() => { deleteCurrentProfile()}} style={{float:'right'}} className="skewed-button">Yes, delete it</button>
                        <button onClick={() => { setCurrentPage('main')}} style={{float:'left'}} className="skewed-button">Cancel</button>
                    </div>
                    <br/>
                </div>
            </div>
            )}

            {currentPage === 'advanced' && (
            <div className="content" style={{textAlign:'center !important'}}>
                <div className="transparent-blur" style={{height: 440, width: 950, padding: 15, margin: '0 auto', textAlign:'left'}}>
                    <button onClick={() => {
                        if (encoderRatio <= 0) {
                            setEncoderRatio(1.0);
                            alert('The value for encoder ratio should be integer or float');
                            return;
                        }
                        if (angleRatio <= 0) {
                            setAngleRatio(1.0);
                            alert('The value for angle ratio should be integer or float');
                            return;
                        }
                        syncConfigData({encoderRatio: encoderRatio, angleRatio: angleRatio});
                        setCurrentPage('main');
                        let newReload = reload + 1;
                        setReload(newReload);
                    }} className="skewed-button">Back</button>
                    <h3>Advanced Settings</h3>
                    Encoder Ratio<br/>
                    <input
                        className="skew"
                        placeholder="1.0"
                        step="0.01"
                        type="number"
                        style={{paddingLeft: 10, height: 20, marginRight: 5}}
                        onChange={(e) => {
                            setEncoderRatio(e.target.value);
                        }} 
                        ref={advancedSettingsEncoderRatioInputRef}
                        value={encoderRatio}
                    />
                    <br/>
                    <br/>
                    Angle Ratio<br/>
                    <input
                        className="skew"
                        placeholder="1.0"
                        step="0.01"
                        type="number"
                        style={{paddingLeft: 10, height: 20, marginRight: 5}}
                        onChange={(e) => {
                            setAngleRatio(e.target.value);
                        }} 
                        value={angleRatio}
                    />
                    <br/>
                    <br/>
                    {/* 
                    <button onClick={() => {
                        if (confirm('Are you sure that you want to reset everything?')) {
                            syncConfigData(defaultConfig);
                            syncProfileData(defaultProfiles);
                            window.location.reload();
                        }
                    }} className="skewed-button">Reset to factory settings</button>
                    <br/>
                    */}
                </div>
            </div>
            )}

            {currentPage === 'calibration' && (
            <div className="content" style={{textAlign:'center !important'}}>
                <div className="transparent-blur" style={{height: 440, width: 950, padding: 15, margin: '0 auto', textAlign:'left'}}>
                    <h3>Calibration</h3>
                    <div style={{float:'right', top: 0, marginRight: 100, textAlign:'center', width:250}}>
                        <div style={{
                            borderRight: calibrationRightDone ? '5px solid green' : '5px solid grey',
                            borderLeft: calibrationLeftDone ? '5px solid green' : '5px solid grey',
                            marginBottom: 30,
                            textAlign: 'center'
                        }}>
	    	                <img src={connectedDevice === '' ? steeringWheel : steeringWheelActive} 
                                    style={{
                                    height: 200,
                                    transform: `rotate(${rotation}deg)`,
                                    transformOrigin: 'center center',
                                }}
                            />
                        </div>
                    <button onClick={() => {
                        if (!calibrationLeftDone || !calibrationRightDone) return;
                        exitCalibration();
                    }} className={'skewed-button' + ((calibrationLeftDone && calibrationRightDone) ? '': ' disabled')}>Done</button>
                    <button onClick={() => {
                        exitCalibration();
                    }} className={'skewed-button'}>Skip</button>
                    </div>
                    <p style={{marginTop:50, lineHeight: 2}}>
1.&nbsp;&nbsp;Rotate the steering wheel to the right until it reaches the bump stop.
<br/>
2.&nbsp;&nbsp;Then otate the steering wheel to the left until it reaches the bump stop.
<br/>
3.&nbsp;&nbsp;Click "Done" once you have completed the steps above.</p>
                    <br/>
                </div>
            </div>
            )}

            {currentPage === 'main' && (
            <div id="footer">
                <div style={{width: '100%', verticalAlign: 'top', padding: 7}}>
                    {profiles.current !== 'Default' && !profileChanged && (
                        <button onClick={() => { setCurrentPage('deleteprofile') }} className="skewed-button">Delete</button>
                    )}
                    <button onClick={() => { setCurrentPage('profiles')}} className="skewed-button" style={{marginRight: 2}}>▲ Profile: {profiles.current}</button>
                    {profileChanged && profiles.current !== 'Default' && (
                        <button onClick={() => { saveProfile(); }} className="skewed-button blinking-save-button">Save</button>
                    )}
                    <button
                        style={{marginLeft: 20}}
                        onClick={() => {
                        setCurrentPage('newprofile');
                        setNewProfileName('');
                        setTimeout(() => {
                            if (newProfileInputRef && newProfileInputRef.current) {
                                newProfileInputRef.current.focus();
                            }
                        }, 200);
                    }} className="skewed-button">Create new profile</button>
                    <button onClick={() => { setCurrentPage('about')}} style={{float: 'right', marginRight: 30}} className="skewed-button">About</button>
                    <button onClick={() => { setCurrentPage('thirdparty')}} style={{float: 'right'}} className="skewed-button">Third-party softwares</button>
                    <button 
                        onClick={() => { 
                            setCurrentPage('advanced')
                            if (advancedSettingsEncoderRatioInputRef && advancedSettingsEncoderRatioInputRef.current) {
                                advancedSettingsEncoderRatioInputRef.current.focus();
                            }
                    }}
                        style={{float: 'right'}} className="skewed-button">Advanced Settings</button>
                </div>
            </div>
            )}
        </div>
    )
}

export default App;
