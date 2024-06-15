import {useEffect, useState} from 'react';
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import { appWindow } from '@tauri-apps/api/window';
import paddockLogo from "./assets/paddock-logo.png";
import axisTab from "./assets/axis-tab.png";
import effectTab from "./assets/effect-tab.png";
import steeringWheel from "./assets/steering-wheel.png";
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

    const [status, setStatus] = useState('Disconnected');
    const [connectedDevice, setConnectedDevice] = useState('');
    const [message, setMessage] = useState('');

    const setCenterPosition = async (e) => {
        let input = "center" + ":0";
        await invoke("set_value", { input });
    }

    const updateSliderValue = async (e) => {
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
      setInterval(() => {
          getDevices();
      }, 1000);
    }, [])

    return (
        <div id="app">
	        <div className="titlebar" data-tauri-drag-region>
                <div id="titlebar-buttons">
                    <button className="titlebar-button" id="close" onClick={closeApp}>×</button>
                    <button className="titlebar-button" id="minimize" onClick={minimizeApp}>−</button>
                </div>
                <div className="title" data-tauri-drag-region>
                    <img src={paddockLogo} width="300" data-tauri-drag-region/>
	    	    <div className="device-box">
                <div className="status">
	    	    {status} 
                    {connectedDevice && connectedDevice.length > 0 && (
                        <span> ({connectedDevice})</span>
                    )}
                    {message && message.length > 0 && (
                        <span> {message}</span>
                    )}
                </div>
	    	    </div>
                </div>
            </div>
            <div className="content">
                <div className="col-axis">
	    	    <img src={axisTab} style={{height:30, align:'left'}}/>
                    <div className="slider-container">
                        <div id="slider-value" className="slider-value">Steering Angle <span style={{float:'right', marginRight:30}}>{sliderDegreesValue} degrees</span></div>
                        <input
                            id="degrees"
                            disabled={!(connectedDevice && connectedDevice.length > 0)}
                            className={(connectedDevice && connectedDevice.length > 0) ? 'slider' : 'slider-disabled'}
                            type="range"
                            min="90"
                            max="1440"
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
	    	    <img src={steeringWheel} style={{height:200, align:'left', marginTop:40, marginBottom:30}}/>
                        <button onClick={setCenterPosition}>Set center position</button>
                </div>

            </div>
            <div id="footer">
            </div>
        </div>
    )
}

export default App;
