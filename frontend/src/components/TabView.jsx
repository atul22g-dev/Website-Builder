import React, { useState } from 'react'

const TabView = () => {
    const [activeButton, setActiveButton] = useState('code');

    // Function to handle button click
    const handleButtonClick = (button) => {
        setActiveButton(button);
    };

    return (
        <div className='border-b-2 border-b-gray-700'>
            <div className="flex gap-1 h-fit w-fit rounded-full bg-gray-700 p-1 m-2">
                {/* Code Button */}
                <div
                    className={`relative w-fit h-fit rounded-full px-2.5 py-1 text-sm transition-all ${activeButton === 'code' ? 'bg-gray-900' : ''}`}
                    onClick={() => handleButtonClick('code')}
                >
                    <button className="text-white font-semibold">Code</button>
                </div>

                {/* Preview Button */}
                <div
                    className={`relative w-fit h-fit rounded-full px-2.5 py-1 text-sm transition-all ${activeButton === 'preview' ? 'bg-gray-900' : ''}`}
                    onClick={() => handleButtonClick('preview')}
                >
                    <button className="text-white font-semibold">Preview</button>
                </div>
            </div>
        </div>
    )
}

export default TabView