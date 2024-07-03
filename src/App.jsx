import {useEffect, useState, useRef} from 'react';
import { invoke } from "@tauri-apps/api/tauri";
import { BaseDirectory, createDir, readTextFile, writeTextFile, exists } from "@tauri-apps/api/fs";
import { appDataDir } from '@tauri-apps/api/path';
import "./App.css";
import { appWindow } from '@tauri-apps/api/window';
import paddockLogo from "./assets/paddock-logo.png";
import axisTab from "./assets/axis-tab.png";
import effectTab from "./assets/effect-tab.png";
import steeringWheel from "./assets/steering-wheel.png";
import steeringWheelActive from "./assets/steering-wheel-active.png";
import steeringWheelTitle from "./assets/steering-wheel-angle-title.png";

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
    const newProfileInputRef = useRef(null);

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
            if (key === 'name') { // This could cause crash in Rust side.
                continue;
            }
            let value = profile[key];
            let input = key + ":" + value
            await invoke("set_value", { input });
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
        let defaultProfiles = {
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
                        applyProfile(existing.profiles[0]);
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
        setRotation(Math.floor(degs));
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

    const updateSliderValue = async (e) => {
        setProfileChanged(true);
        switch (e.target.id) {
            case "power":
                setSliderPowerValue(e.target.value);
                break;
            case "intensity":
                setSliderIntensityValue(e.target.value);
                break;
            case "degrees":
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
        let input = e.target.id + ":" + e.target.value;
        await invoke("set_value", { input });
    };

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
        appWindow.setResizable(false);
        appWindow.setTitle('RPS Paddock')

        syncProfileData(null);

        const readDeviceEncoderInterval = setInterval(() => {
            readDeviceEncoder();
        }, 50);

        const getDeviceInterval = setInterval(() => {
            getDevices();
        }, 1000);

        return () => {
            clearInterval(getDeviceInterval);
            clearInterval(readDeviceEncoderInterval);
        }
    }, [status])

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
                <div className="title" data-tauri-drag-region>
                    <img src={paddockLogo} width="300" data-tauri-drag-region/>
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
                        <div id="slider-value" className="slider-value">Steering Angle <span style={{float:'right', marginRight:30}}>{sliderDegreesValue}°</span></div>
                        <input
                            id="degrees"
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
                        <div id="slider-value" className="slider-value">Power <span style={{float:'right', marginRight:30}}>{sliderPowerValue}%</span></div>
                        <input
                            id="power"
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
                        <div id="slider-value" className="slider-value">Intensity <span style={{float:'right', marginRight:30}}>{sliderIntensityValue}</span></div>
                        <input
                            id="intensity"
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
                        <div id="slider-value" className="slider-value">Bumpstop <span style={{float:'right', marginRight:30}}>{sliderBumpstopValue}</span></div>
                        <input
                            id="bumpstop"
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
                        <div id="slider-value" className="slider-value">Idle Spring <span style={{float:'right', marginRight:30}}>{sliderIdleSpringValue}</span></div>
                        <input
                            id="idlespring"
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
                        <div id="slider-value" className="slider-value">Mechanical Damper <span style={{float:'right', marginRight:30}}>{sliderMechanicalDamperValue}</span></div>
                        <input
                            id="mechanicaldamper"
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
                        <div id="slider-value" className="slider-value">Damper <span style={{float:'right', marginRight:30}}>{sliderDamperValue}</span></div>
                        <input
                            id="damper"
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
                        <div id="slider-value" className="slider-value">Spring <span style={{float:'right', marginRight:30}}>{sliderSpringValue}</span></div>
                        <input
                            id="spring"
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
                        <div id="slider-value" className="slider-value">Friction <span style={{float:'right', marginRight:30}}>{sliderFrictionValue}</span></div>
                        <input
                            id="friction"
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
                        <div id="slider-value" className="slider-value">Inertia <span style={{float:'right', marginRight:30}}>{sliderInertiaValue}</span></div>
                        <input
                            id="inertia"
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
                        <div id="slider-value" className="slider-value">Filter frequency<span style={{float:'right', marginRight:30}}>{sliderFilterFreqValue} Hz</span></div>
                        <input
                            id="filterfreq"
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
                        <div id="slider-value" className="slider-value">Filter Q<span style={{float:'right', marginRight:30}}>{sliderFilterQValue}</span></div>
                        <input
                            id="filterq"
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
                            setSliderDamperValue('360');
                            updateSliderValue({target: { id: 'degrees', value: '360'}})
                            }}
                        >
                            360°
                        </button>
                        <button
                            className={'skewed-button ' + (sliderDegreesValue === '540' ? 'skewed-button-active' : '')}
                            onClick={() => {
                            setSliderDamperValue('540');
                            updateSliderValue({target: { id: 'degrees', value: '540'}})
                            }}
                        >
                            540°
                        </button>
                        <button
                            className={'skewed-button ' + (sliderDegreesValue === '900' ? 'skewed-button-active' : '')}
                            onClick={() => {
                            setSliderDamperValue('900');
                            updateSliderValue({target: { id: 'degrees', value: '900'}})
                            }}
                        >
                            900°
                        </button>
                        <button
                            className={'skewed-button ' + (sliderDegreesValue === '1080' ? 'skewed-button-active' : '')}
                            onClick={() => {
                            setSliderDamperValue('1080');
                            updateSliderValue({target: { id: 'degrees', value: '1080'}})
                            }}
                        >
                            1080°
                        </button>
                        </div>
                        <br/>
                <button onClick={setCenterPosition} className="set-center-button">Set center position</button>
                <br/>
                {/* 
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
                    <h3>About Us</h3>
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
                            console.log(e.target);
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
                <div className="transparent-blur" style={{height: 140, width: 400, padding: 15, margin: '0 auto'}}>
                    <h3>Delete Profile</h3>
                    <br/>
                    Are you sure that you want to delete {profiles.current} profile?
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
                    <button onClick={() => { setCurrentPage('about')}} style={{float: 'right', marginRight: 30}} className="skewed-button">About us</button>
                    <button onClick={() => { setCurrentPage('thirdparty')}} style={{float: 'right'}} className="skewed-button">Third-party softwares</button>
                    {/*
                        <button onClick={() => { setCurrentPage('advanced')}} style={{float: 'right'}} className="skewed-button">Advanced Settings</button>
                     */}
                </div>
            </div>
            )}
        </div>
    )
}

export default App;
