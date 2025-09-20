import React from 'react';
import { Check } from 'lucide-react';

const PricingSection = ({ plans, heading, description }) => {
  return (
    <div className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary dark:text-white mb-4">
            {heading}
          </h2>
          <p className="text-lg text-text-secondary dark:text-gray-300 max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-8 ${
                plan.highlighted
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-xl'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-text-primary dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-text-secondary dark:text-gray-300 mb-4">
                  {plan.info}
                </p>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-text-primary dark:text-white">
                    ${plan.price.monthly}
                  </span>
                  <span className="text-text-secondary dark:text-gray-400 ml-2">
                    /month
                  </span>
                </div>
                <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
                  or ${plan.price.yearly} yearly
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-text-primary dark:text-white">
                        {feature.text}
                      </span>
                      {feature.tooltip && (
                        <span className="block text-sm text-text-secondary dark:text-gray-400">
                          {feature.tooltip}
                        </span>
                      )}
                      {feature.limit && (
                        <span className="block text-sm text-text-secondary dark:text-gray-400">
                          {feature.limit}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="text-center">
                <button
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    plan.highlighted
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white'
                  }`}
                >
                  {plan.btn.text}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { PricingSection };