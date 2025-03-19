import React, { useState } from 'react'
import { CheckCircle, Circle, Clock } from 'lucide-react';

const StepsList = ({ steps }) => {
    const seenSteps = new Set();
    const [currentStep, setCurrentStep] = useState(1);

    return (
        <div className="bg-gray-900 rounded-lg shadow-lg p-4 h-full overflow-auto scroll-hidden">
            <h2 className="text-lg font-semibold mb-4 text-gray-100">Build Steps</h2>
            <div className="space-y-4">
                {steps.map((step, index) => {
                    if (seenSteps.has(step.id) || seenSteps.has(step.title)) {
                        return null;
                    }
                    seenSteps.add(step.id);
                    seenSteps.add(step.title);

                    return (
                        <div
                            key={index}
                            className={`rounded-lg cursor-pointer transition-colors p-2 ${currentStep === step.id
                                ? 'bg-gray-800 border border-gray-700'
                                : 'hover:bg-gray-800'
                                }`}
                            onClick={() => setCurrentStep(step.id)}
                        >
                            <div className="flex items-center gap-2">
                                {step.status === 'completed' ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : step.status === 'in-progress' ? (
                                    <Clock className="w-5 h-5 text-blue-400" />
                                ) : (
                                    <Circle className="w-5 h-5 text-gray-600" />
                                )}
                                <h3 className="font-medium text-gray-100">{step.title}</h3>
                            </div>
                            <p className="text-sm text-gray-400 mt-2">{step.description}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default StepsList;
