import React, { useState } from 'react';

interface ElementItem {
  identifier: string;
  type: string;
  title: string;
  elementItems: any[]; // or better type if you want
}

interface QuestionGroup {
  tag: string;
  title: string;
  elements: ElementItem[];
}

interface Step {
  tag: string;
  title: string;
  questionGroups: QuestionGroup[];
}

type JsonData = {
  steps: Step[];
};

function App() {
  const [jsonData, setJsonData] = useState<JsonData | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
if (!parsed.steps || !Array.isArray(parsed.steps)) {
  alert('Invalid JSON: missing "steps" array');
  return;
}
setJsonData(parsed);
      } catch (error) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen">
      {/* Left Panel */}
      <div className="w-1/4 bg-gray-100 p-2 overflow-auto">
        <input type="file" accept=".json" onChange={handleFileUpload} className="mb-2" />
        {jsonData ? (
          <ul className="text-sm">
            {jsonData?.steps?.map((step) => (
              <li key={step.tag} className="mb-1">
                📁 {step.title}
                <ul className="ml-4">
                  {step.questionGroups?.map((group) => (
  <li key={group.tag} className="mb-1">
    📁 {group.title}
    <ul className="ml-4">
      {group.elements?.map((el) => (
        <li key={el.identifier}>📝 {el.title} ({el.type})</li>
      ))}
    </ul>
  </li>
))}
                </ul>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Upload a JSON file to see the content tree.</p>
        )}
      </div>

      {/* Center Panel */}
      <div className="flex-1 bg-white p-4">
        <p className="text-gray-500">Center panel (for editing details later)</p>
      </div>

      {/* Right Panel */}
      <div className="w-1/4 bg-gray-50 p-2 overflow-auto">
        <p className="font-bold">JSON preview</p>
        <pre className="text-xs whitespace-pre-wrap">
          {jsonData ? JSON.stringify(jsonData, null, 2) : 'No data'}
        </pre>
      </div>
    </div>
  );
}

export default App;