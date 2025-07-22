import React, { useState } from 'react';

interface ElementItem {
  identifier: string;
  type: string;
  title: string;
  elementItems: any[];
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
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [selectedPath, setSelectedPath] = useState<(string | number)[] | null>(null);
  const [newElementType, setNewElementType] = useState<string>("textbox");

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

  const handleFieldChange = (field: string, value: string) => {
    if (!jsonData || !selectedPath) return;

    const newData = structuredClone(jsonData);
    let current: any = newData;
    for (let i = 0; i < selectedPath.length; i++) {
      current = current[selectedPath[i]];
    }

    current[field] = value;

    setJsonData(newData);
    setSelectedNode(current);
  };

  const handleDownload = () => {
    if (!jsonData) return;

    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "edited-form.json";
    link.click();

    URL.revokeObjectURL(url);
  };

  const moveElement = (stepIdx: number, groupIdx: number, elIdx: number, direction: number) => {
  if (!jsonData) return;

  const newData = structuredClone(jsonData);
  const elements = newData.steps[stepIdx].questionGroups[groupIdx].elements;

  const targetIdx = elIdx + direction;
  if (targetIdx < 0 || targetIdx >= elements.length) return;

  // swap elements
  [elements[elIdx], elements[targetIdx]] = [elements[targetIdx], elements[elIdx]];

  // update sortOrder: make them 1,2,3,...
  elements.forEach((el: any, idx: number) => {
    el.sortOrder = idx + 1;
  });

  setJsonData(newData);

  // keep selection synced (select moved element)
  setSelectedNode(elements[targetIdx]);
  setSelectedPath(['steps', stepIdx, 'questionGroups', groupIdx, 'elements', targetIdx]);
};

  const addElement = (stepIdx: number, groupIdx: number) => {
    if (!jsonData) return;

    const newData = structuredClone(jsonData);
    const elements = newData.steps[stepIdx].questionGroups[groupIdx].elements;

    const newElement = {
      identifier: `new_element_${Date.now()}`,
      type: newElementType,
      title: `New ${newElementType}`,
      elementItems: [],
      sortOrder: elements.length + 1,
      validations: {},
      attributes: {},
      dependency: []
    };

    elements.push(newElement);

    setJsonData(newData);
    setSelectedNode(newElement);
    setSelectedPath(['steps', stepIdx, 'questionGroups', groupIdx, 'elements', elements.length - 1]);
  };

  const deleteElement = (stepIdx: number, groupIdx: number, elIdx: number) => {
    if (!jsonData) return;

    const newData = structuredClone(jsonData);
    const elements = newData.steps[stepIdx].questionGroups[groupIdx].elements;

    elements.splice(elIdx, 1);
    elements.forEach((el: any, idx: number) => {
      el.sortOrder = idx + 1;
    });

    setJsonData(newData);
    setSelectedNode(null);
    setSelectedPath(null);
  };

  const duplicateElement = (stepIdx: number, groupIdx: number, elIdx: number) => {
    if (!jsonData) return;

    const newData = structuredClone(jsonData);
    const elements = newData.steps[stepIdx].questionGroups[groupIdx].elements;

    const elementToCopy = elements[elIdx];
    const newElement = {
      ...structuredClone(elementToCopy),
      identifier: `${elementToCopy.identifier}_copy_${Date.now()}`,
      title: `${elementToCopy.title} (Copy)`,
      sortOrder: elements.length + 1
    };

    elements.splice(elIdx + 1, 0, newElement);

    // update sortOrder
    elements.forEach((el: any, idx: number) => {
      el.sortOrder = idx + 1;
    });

    setJsonData(newData);
    setSelectedNode(newElement);
    setSelectedPath(['steps', stepIdx, 'questionGroups', groupIdx, 'elements', elIdx + 1]);
  };

  return (
    <div className="flex h-screen">
      {/* Left Panel */}
      <div className="w-1/4 bg-gray-100 p-2 overflow-auto">
        <input type="file" accept=".json" onChange={handleFileUpload} className="mb-2" />
        {jsonData ? (
          <ul className="text-sm">
            {jsonData.steps.map((step, stepIndex) => (
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
                  {step.questionGroups.map((group, groupIndex) => (
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
                        {group.elements.map((el, elIndex) => (
                          <li
                            key={el.identifier}
                            className={`cursor-pointer rounded hover:bg-blue-50 ${selectedNode === el ? 'bg-blue-100' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedNode(el);
                              setSelectedPath(['steps', stepIndex, 'questionGroups', groupIndex, 'elements', elIndex]);
                            }}
                          >
                            <div className="flex items-center space-x-1">
                              <span className="flex-1">
                                📝 {el.title} ({el.type})
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveElement(stepIndex, groupIndex, elIndex, -1);
                                }}
                                disabled={elIndex === 0}
                                className="text-xs text-gray-500 hover:text-black"
                              >
                                ▲
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveElement(stepIndex, groupIndex, elIndex, 1);
                                }}
                                disabled={elIndex === group.elements.length - 1}
                                className="text-xs text-gray-500 hover:text-black"
                              >
                                ▼
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateElement(stepIndex, groupIndex, elIndex);
                                }}
                                className="text-xs text-yellow-500 hover:text-yellow-700"
                              >
                                ⧉
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteElement(stepIndex, groupIndex, elIndex);
                                }}
                                className="text-xs text-red-500 hover:text-red-700"
                              >
                                🗑
                              </button>
                            </div>
                          </li>
                        ))}
                        <div className="flex items-center space-x-1 mt-1">
                          <select
                            value={newElementType}
                            onChange={(e) => setNewElementType(e.target.value)}
                            className="text-xs border rounded"
                          >
                            <option value="textbox">Textbox</option>
                            <option value="simpleDropdown">Simple Dropdown</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="image">Image</option>
                          </select>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addElement(stepIndex, groupIndex);
                            }}
                            className="text-xs text-green-600 hover:text-green-800"
                          >
                            ➕ Add
                          </button>
                        </div>
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
            {/* Show common fields */}
            {['identifier', 'tag', 'title', 'type', 'value', 'sortOrder', 'isEnabled'].map((field) =>
              field in selectedNode ? (
                <div key={field}>
                  <label className="block text-xs font-semibold">{field}</label>
                  <input
                    type="text"
                    className="border rounded p-1 w-full text-sm"
                    value={String(selectedNode[field])}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                  />
                </div>
              ) : null
            )}

            {/* Show attributes as read-only JSON */}
            {'attributes' in selectedNode && selectedNode.attributes && typeof selectedNode.attributes === 'object' && (
              <div>
                <label className="block text-xs font-semibold">attributes</label>
                <pre className="bg-gray-100 rounded p-1 text-xs whitespace-pre-wrap">
                  {JSON.stringify(selectedNode.attributes, null, 2)}
                </pre>
              </div>
            )}

            {/* Show validations as read-only JSON */}
            {'validations' in selectedNode && selectedNode.validations && typeof selectedNode.validations === 'object' && (
              <div>
                <label className="block text-xs font-semibold">validations</label>
                <pre className="bg-gray-100 rounded p-1 text-xs whitespace-pre-wrap">
                  {JSON.stringify(selectedNode.validations, null, 2)}
                </pre>
              </div>
            )}

            {/* Show dependency as read-only JSON */}
            {'dependency' in selectedNode && Array.isArray(selectedNode.dependency) && (
              <div>
                <label className="block text-xs font-semibold">dependency</label>
                <pre className="bg-gray-100 rounded p-1 text-xs whitespace-pre-wrap">
                  {JSON.stringify(selectedNode.dependency, null, 2)}
                </pre>
              </div>
            )}

            {/* Show elementItems as read-only JSON */}
            {'elementItems' in selectedNode && Array.isArray(selectedNode.elementItems) && (
              <div>
                <label className="block text-xs font-semibold">elementItems</label>
                <pre className="bg-gray-100 rounded p-1 text-xs whitespace-pre-wrap">
                  {JSON.stringify(selectedNode.elementItems, null, 2)}
                </pre>
              </div>
            )}
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
        {jsonData && (
          <button
            onClick={handleDownload}
            className="mt-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Download JSON
          </button>
        )}
      </div>
    </div>
  );
}

export default App;