import {useEffect, useState} from 'react';
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";

function App() {
    const [sliderPowerValue, setSliderPowerValue] = useState(50);
    const [sliderDetailValue, setSliderDetailValue] = useState(50);
    const [sliderRangeValue, setSliderRangeValue] = useState(540);
    const [sliderBumpstopValue, setSliderBumpstopValue] = useState(50);
    const [sliderMechanicalDamperValue, setSliderMechanicalDamperValue] = useState(50);
    const [sliderDamperValue, setSliderDamperValue] = useState(50);
    const [sliderSpringValue, setSliderSpringValue] = useState(50);
    const [sliderFrictionValue, setSliderFrictionValue] = useState(50);
    const [sliderInertiaValue, setSliderInertiaValue] = useState(50);

    const [status, setStatus] = useState('Disconnected');
    const [connectedDevice, setConnectedDevice] = useState('');
    const [message, setMessage] = useState('');

    const updateSliderPowerValue = async (e) => {
        setSliderPowerValue(e.target.value)
        let input = "power:" + e.target.value;
        await invoke("set_value", { input });
    };

    const updateSliderDetailValue = (e) => {
        setSliderDetailValue(e.target.value)
        //UpdateValue("?", e.target.value);
    };

    const updateSliderRangeValue = (e) => {
        setSliderRangeValue(e.target.value)
        //UpdateValue("?", e.target.value);
    };

    const updateSliderBumpstopValue = (e) => {
        setSliderBumpstopValue(e.target.value)
        //UpdateValue("range", e.target.value);
    };

    const updateSliderMechanicalDamperValue = (e) => {
        setSliderMechanicalDamperValue(e.target.value)
        //UpdateValue("?", e.target.value);
    };

    const updateSliderDamperValue = (e) => {
        setSliderDamperValue(e.target.value)
        //UpdateValue("?", e.target.value);
    };

    const updateSliderSpringValue = (e) => {
        setSliderSpringValue(e.target.value)
        //UpdateValue("?", e.target.value);
    };

    const updateSliderFrictionValue = (e) => {
        setSliderFrictionValue(e.target.value)
        //UpdateValue("?", e.target.value);
    };

    const updateSliderInertiaValue = (e) => {
        setSliderInertiaValue(e.target.value)
        //UpdateValue("?", e.target.value);
    };


    const getDevices = async () => {
        setMessage('');
        let device = await invoke("get_device");
        if (device && device.length > 0) {
                setStatus('Connected')
                setConnectedDevice(device);
        } else {
                setStatus('Disconnected');
                setConnectedDevice('');
        }
    }

    useEffect(() => {
      setInterval(() => {
          getDevices();
      }, 1000);
    }, [])

    return (
        <div id="App">
	    <div className="topbar">
            <h1>RPS Paddock</h1>
        <div>{status} 
            {connectedDevice && connectedDevice.length > 0 && (
                <span> ({connectedDevice})</span>
            )}
        </div>
        </div>
        <div id="slider-container" className="slider-container">
                <div id="slider-value" className="slider-value">Power: {sliderPowerValue}%</div>
                <input
                    disabled={!(connectedDevice && connectedDevice.length > 0)}
                    className={(connectedDevice && connectedDevice.length > 0) ? 'slider' : 'slider-disabled'}
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPowerValue}
                    onChange={updateSliderPowerValue}
                    id="slider"
                />
        </div>
        <div id="slider-container" className="slider-container">
                <div id="slider-value" className="slider-value">Detail: {sliderDetailValue}</div>
                <input
                    disabled={!(connectedDevice && connectedDevice.length > 0)}
                    className={(connectedDevice && connectedDevice.length > 0) ? 'slider' : 'slider-disabled'}
                    type="range"
                    min="0"
                    max="100"
                    value={sliderDetailValue}
                    onChange={updateSliderDetailValue}
                    id="slider"
                />
        </div>
        <div id="slider-container" className="slider-container">
                <div id="slider-value" className="slider-value">Steering Angle: {sliderRangeValue} degree</div>
                <input
                    disabled={!(connectedDevice && connectedDevice.length > 0)}
                    className={(connectedDevice && connectedDevice.length > 0) ? 'slider' : 'slider-disabled'}
                    type="range"
                    min="90"
                    max="1440"
                    value={sliderRangeValue}
                    onChange={updateSliderRangeValue}
                    id="slider"
                />
        </div>
        <div id="slider-container" className="slider-container">
                <div id="slider-value" className="slider-value">Bumpstop: {sliderBumpstopValue}</div>
                <input
                    disabled={!(connectedDevice && connectedDevice.length > 0)}
                    className={(connectedDevice && connectedDevice.length > 0) ? 'slider' : 'slider-disabled'}
                    type="range"
                    min="10"
                    max="100"
                    value={sliderBumpstopValue}
                    onChange={updateSliderBumpstopValue}
                    id="slider"
                />
        </div>
        <div id="slider-container" className="slider-container">
                <div id="slider-value" className="slider-value">Mechanical Damper: {sliderMechanicalDamperValue}</div>
                <input
                    disabled={!(connectedDevice && connectedDevice.length > 0)}
                    className={(connectedDevice && connectedDevice.length > 0) ? 'slider' : 'slider-disabled'}
                    type="range"
                    min="0"
                    max="100"
                    value={sliderMechanicalDamperValue}
                    onChange={updateSliderMechanicalDamperValue}
                    id="slider"
                />
        </div>
        <div id="slider-container" className="slider-container">
                <div id="slider-value" className="slider-value">Damper: {sliderDamperValue}</div>
                <input
                    disabled={!(connectedDevice && connectedDevice.length > 0)}
                    className={(connectedDevice && connectedDevice.length > 0) ? 'slider' : 'slider-disabled'}
                    type="range"
                    min="0"
                    max="100"
                    value={sliderDamperValue}
                    onChange={updateSliderDamperValue}
                    id="slider"
                />
        </div>
        <div id="slider-container" className="slider-container">
                <div id="slider-value" className="slider-value">Spring: {sliderSpringValue}</div>
                <input
                    disabled={!(connectedDevice && connectedDevice.length > 0)}
                    className={(connectedDevice && connectedDevice.length > 0) ? 'slider' : 'slider-disabled'}
                    type="range"
                    min="0"
                    max="100"
                    value={sliderSpringValue}
                    onChange={updateSliderSpringValue}
                    id="slider"
                />
        </div>
        <div id="slider-container" className="slider-container">
                <div id="slider-value" className="slider-value">Friction: {sliderFrictionValue}</div>
                <input
                    disabled={!(connectedDevice && connectedDevice.length > 0)}
                    className={(connectedDevice && connectedDevice.length > 0) ? 'slider' : 'slider-disabled'}
                    type="range"
                    min="0"
                    max="100"
                    value={sliderFrictionValue}
                    onChange={updateSliderFrictionValue}
                    id="slider"
                />
        </div>
        <div id="slider-container" className="slider-container">
                <div id="slider-value" className="slider-value">Intertia: {sliderInertiaValue}</div>
                <input
                    disabled={!(connectedDevice && connectedDevice.length > 0)}
                    className={(connectedDevice && connectedDevice.length > 0) ? 'slider' : 'slider-disabled'}
                    type="range"
                    min="0"
                    max="100"
                    value={sliderInertiaValue}
                    onChange={updateSliderInertiaValue}
                    id="slider"
                />
        </div>
        </div>
    )
}

export default App;
