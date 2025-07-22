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

  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [selectedPath, setSelectedPath] = useState<(string | number)[] | null>(null);

  const handleFieldChange = (field: string, value: string) => {
    if (!jsonData || !selectedPath) return;

    const newData = structuredClone(jsonData); // deep copy

    // Walk into the path
    let current: any = newData;
    for (let i = 0; i < selectedPath.length; i++) {
      current = current[selectedPath[i]];
    }

    // Update field
    current[field] = value;

    setJsonData(newData);
    setSelectedNode(current); // keep UI in sync
  };
  

  return (
    <div className="flex h-screen">
      {/* Left Panel */}
      <div className="w-1/4 bg-gray-100 p-2 overflow-auto">
        <input type="file" accept=".json" onChange={handleFileUpload} className="mb-2" />
        {jsonData ? (
          <ul className="text-sm">
  {jsonData?.steps?.map((step, stepIndex) => (
    <li
      key={step.tag}
      className={`mb-1 cursor-pointer rounded hover:bg-blue-50 ${selectedNode === step ? 'bg-blue-100' : ''}`}
      onClick={() => {
  setSelectedNode(step);
  setSelectedPath(['steps', stepIndex]);
}}
    >
      📁 {step.title}
      <ul className="ml-4">
        {step.questionGroups?.map((group, groupIndex) => (
          <li
            key={group.tag}
            className={`mb-1 cursor-pointer rounded hover:bg-blue-50 ${selectedNode === group ? 'bg-blue-100' : ''}`}
            onClick={(e) => {
  e.stopPropagation();
  setSelectedNode(group);
  setSelectedPath(['steps', stepIndex, 'questionGroups', groupIndex]);
}}
          >
            📁 {group.title}
            <ul className="ml-4">
              {group.elements?.map((el, elIndex) => (
                <li
                  key={el.identifier}
                  className={`cursor-pointer rounded hover:bg-blue-50 ${selectedNode === el ? 'bg-blue-100' : ''}`}
                  onClick={(e) => {
  e.stopPropagation();
  setSelectedNode(el);
  setSelectedPath(['steps', stepIndex, 'questionGroups', groupIndex, 'elements', elIndex]);
}}
                >
                  📝 {el.title} ({el.type})
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </li>
  ))}
</ul>
        ) : (
          <p className="text-gray-500">Upload a JSON file to see the tree.</p>
        )}
      </div>

      {/* Center Panel */}
      <div className="flex-1 bg-white p-4">
        {selectedNode ? (
  <div className="space-y-2">
    {Object.entries(selectedNode)
  .filter(([key, _]) =>
    key !== 'questionGroups' && key !== 'elements'
  )
  .map(([key, value]) => (
      <div key={key}>
        <label className="block text-xs font-semibold">{key}</label>
        {typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? (
          <input
  type="text"
  className="border rounded p-1 w-full text-sm"
  value={String(value)}
  onChange={(e) => handleFieldChange(key, e.target.value)}
/>
        ) : (
          <pre className="bg-gray-100 rounded p-1 text-xs whitespace-pre-wrap">
            {JSON.stringify(value, null, 2)}
          </pre>
        )}
      </div>
    ))}
  </div>
) : (
  <p className="text-gray-500">Select an item to see details.</p>
)}
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