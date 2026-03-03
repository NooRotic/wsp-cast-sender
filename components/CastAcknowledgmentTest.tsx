'use client';

import React, { useState } from 'react';
import { useCastIntegration } from '@/hooks/useCastIntegration';

/**
 * Test component to demonstrate the acknowledgment system
 */
export const CastAcknowledgmentTest: React.FC = () => {
  const {
    sendPortfolioData,
    sendProjectData,
    sendSkillsData,
    sendContactInfo,
    hasPendingAcknowledgments,
    getPendingAcknowledgmentCount,
    pendingAcknowledgments,
    isConnected
  } = useCastIntegration();

  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testPortfolioData = async () => {
    try {
      addTestResult('🚀 Sending portfolio data...');
      const messageId = await sendPortfolioData({
        name: 'Walter S. Pollard Jr.',
        title: 'Senior Software Engineer',
        projects: [
          { id: 1, name: 'Cast Integration System', tech: ['React', 'TypeScript', 'Cast SDK'] },
          { id: 2, name: 'Portfolio Dashboard', tech: ['Next.js', 'Tailwind'] }
        ]
      });
      addTestResult(`✅ Portfolio data sent with ID: ${messageId}`);
    } catch (error) {
      addTestResult(`❌ Portfolio data failed: ${error}`);
    }
  };

  const testProjectData = async () => {
    try {
      addTestResult('🚀 Sending project data...');
      const messageId = await sendProjectData({
        id: 'cast-system',
        name: 'Advanced Cast Integration',
        description: 'Sophisticated Cast messaging with acknowledgment tracking',
        technologies: ['Cast SDK', 'CAF', 'TypeScript', 'React'],
        features: ['Message Acknowledgment', 'Session Management', 'Error Handling']
      });
      addTestResult(`✅ Project data sent with ID: ${messageId}`);
    } catch (error) {
      addTestResult(`❌ Project data failed: ${error}`);
    }
  };

  const testSkillsData = async () => {
    try {
      addTestResult('🚀 Sending skills data...');
      const messageId = await sendSkillsData([
        { category: 'Frontend', skills: ['React', 'TypeScript', 'Next.js'] },
        { category: 'Backend', skills: ['Node.js', 'Python', 'PostgreSQL'] },
        { category: 'Cast Development', skills: ['Cast SDK', 'CAF', 'Message Handling'] }
      ]);
      addTestResult(`✅ Skills data sent with ID: ${messageId}`);
    } catch (error) {
      addTestResult(`❌ Skills data failed: ${error}`);
    }
  };

  const testContactInfo = async () => {
    try {
      addTestResult('🚀 Sending contact info...');
      const messageId = await sendContactInfo({
        email: 'walter@example.com',
        linkedin: 'https://linkedin.com/in/walterspollard',
        github: 'https://github.com/walterspollard',
        website: 'https://waltersportfolio.com'
      });
      addTestResult(`✅ Contact info sent with ID: ${messageId}`);
    } catch (error) {
      addTestResult(`❌ Contact info failed: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  if (!isConnected) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Cast Not Connected
        </h3>
        <p className="text-yellow-700">
          Please connect to a Cast device first to test the acknowledgment system.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Cast Acknowledgment System Test
        </h2>
        
        {/* Status Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Connection Status</h3>
            <p className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? '✅ Connected' : '❌ Disconnected'}
            </p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-800">Pending Acknowledgments</h3>
            <p className="text-sm text-orange-600">
              {getPendingAcknowledgmentCount()} messages waiting
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800">Has Pending</h3>
            <p className={`text-sm ${hasPendingAcknowledgments() ? 'text-orange-600' : 'text-green-600'}`}>
              {hasPendingAcknowledgments() ? '⏳ Waiting for acks' : '✅ All acknowledged'}
            </p>
          </div>
        </div>

        {/* Pending Messages List */}
        {pendingAcknowledgments.length > 0 && (
          <div className="bg-yellow-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2">Pending Acknowledgments:</h3>
            <ul className="list-disc list-inside text-sm text-yellow-700">
              {pendingAcknowledgments.map(id => (
                <li key={id}>Message ID: {id}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Test Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={testPortfolioData}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Test Portfolio Data
          </button>
          
          <button
            onClick={testProjectData}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Test Project Data
          </button>
          
          <button
            onClick={testSkillsData}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Test Skills Data
          </button>
          
          <button
            onClick={testContactInfo}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Test Contact Info
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={clearResults}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Clear Results
          </button>
        </div>

        {/* Test Results */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3">Test Results:</h3>
          <div className="max-h-64 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-sm">No test results yet. Click the test buttons above.</p>
            ) : (
              <ul className="space-y-1">
                {testResults.map((result, index) => (
                  <li key={index} className="text-sm font-mono text-gray-700 border-b border-gray-200 pb-1">
                    {result}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Testing Instructions:</h3>
          <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
            <li>Ensure you&apos;re connected to a Cast device</li>
            <li>Click the test buttons to send different types of messages</li>
            <li>Watch the console for detailed message flow logs</li>
            <li>Check &quot;Pending Acknowledgments&quot; to see messages waiting for confirmation</li>
            <li>If messages timeout (30 seconds), the receiver needs acknowledgment implementation</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default CastAcknowledgmentTest;
