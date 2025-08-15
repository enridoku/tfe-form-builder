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
  const deliveryOptionsTemplate = {
  identifier: `delivery_options_${Date.now()}`,
  type: "deliveryOptions",
  title: "Delivery options",
  elementItems: [
    {
      tag: "FASTEST",
      title: "FASTEST",
      value: "FASTEST",
      isEnabled: true,
      isSelected: false,
      sortOrder: 1,
      attributes: {
        productionDays: "1",
        cutOffTime: "12:30",
        info: "Delivery_upto_9"
      },
      dependency: []
    },
    {
      tag: "Express",
      title: "Express",
      value: "Express",
      isEnabled: true,
      isSelected: false,
      sortOrder: 2,
      attributes: {
        productionDays: "1",
        cutOffTime: "12:30",
        info: "Delivery_next_day"
      },
      dependency: []
    },
    {
      tag: "FAST_EXPRESS",
      title: "FAST_EXPRESS",
      value: "FAST_EXPRESS",
      isEnabled: true,
      isSelected: false,
      sortOrder: 3,
      attributes: {
        productionDays: "1",
        cutOffTime: "12:30",
        info: "Delivery_upto_1030"
      },
      dependency: []
    },
    {
      tag: "DAY_AFTER_NEXT",
      title: "DAY_AFTER_NEXT",
      value: "DAY_AFTER_NEXT",
      isEnabled: true,
      isSelected: false,
      sortOrder: 4,
      attributes: {
        productionDays: "3",
        cutOffTime: "23:59",
        info: "DAY_AFTER_NEXT_5PERCENT"
      },
      dependency: []
    }
  ],
  validations: {},
  attributes: {},
  dependency: [],
  sortOrder: 0 // will be overwritten dynamically
};
  const [jsonData, setJsonData] = useState<JsonData | null>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [selectedPath, setSelectedPath] = useState<(string | number)[] | null>(null);
  const [newElementType, setNewElementType] = useState<string>("textbox");
  const [pendingAdd, setPendingAdd] = useState<{ stepIdx: number; groupIdx: number } | null>(null);

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

  const addElement = (stepIdx: number, groupIdx: number, type: string) => {
  if (!jsonData) return;

  const newData = structuredClone(jsonData);
  const elements = newData.steps[stepIdx].questionGroups[groupIdx].elements;

  let newElement;

  if (type === "deliveryOptions") {
    newElement = {
      ...structuredClone(deliveryOptionsTemplate),
      identifier: `delivery_options_${Date.now()}`,
      sortOrder: elements.length + 1
    };
  } else {
    newElement = {
      identifier: `new_element_${Date.now()}`,
      type,
      title: `New ${type}`,
      elementItems: [],
      sortOrder: elements.length + 1,
      validations: {},
      attributes: {},
      dependency: []
    };
  }

  elements.push(newElement);

  setJsonData(newData);
  setSelectedNode(newElement);
  setSelectedPath(['steps', stepIdx, 'questionGroups', groupIdx, 'elements', elements.length - 1]);
  setPendingAdd(null);
};

  const moveElement = (stepIdx: number, groupIdx: number, elIdx: number, direction: number) => {
  if (!jsonData) return;

  const newData = structuredClone(jsonData);
  const elements = newData.steps[stepIdx].questionGroups[groupIdx].elements;

  const targetIdx = elIdx + direction;
  if (targetIdx < 0 || targetIdx >= elements.length) return;

  // swap elements
  [elements[elIdx], elements[targetIdx]] = [elements[targetIdx], elements[elIdx]];

  // update sortOrder
  elements.forEach((el: any, idx: number) => {
    el.sortOrder = idx + 1;
  });

  setJsonData(newData);
  // keep selection synced
  setSelectedNode(elements[targetIdx]);
  setSelectedPath(['steps', stepIdx, 'questionGroups', groupIdx, 'elements', targetIdx]);
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

const deleteElement = (stepIdx: number, groupIdx: number, elIdx: number) => {
  if (!jsonData) return;

  const newData = structuredClone(jsonData);
  const elements = newData.steps[stepIdx].questionGroups[groupIdx].elements;

  elements.splice(elIdx, 1);
  // update sortOrder
  elements.forEach((el: any, idx: number) => {
    el.sortOrder = idx + 1;
  });

  setJsonData(newData);
  setSelectedNode(null);
  setSelectedPath(null);
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingAdd({ stepIdx: stepIndex, groupIdx: groupIndex });
                    }}
                    className="text-xs text-green-600 hover:text-green-800 mt-1"
                  >
                    ➕ Add
                  </button>
                </ul>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-gray-500">Upload a JSON file to see the trees here new.</p>
  )}
</div>

      {/* Center Panel */}
      <div className="flex-1 bg-white p-4">
        {pendingAdd ? (
          <div className="space-y-2">
            <p className="text-gray-700 text-sm">Add new element:</p>
            <select
  value={newElementType}
  onChange={(e) => setNewElementType(e.target.value)}
  className="text-sm border rounded p-1"
>
  <option value="label">Label</option>
  <option value="textbox">Textbox</option>
  <option value="zipCode">Zip Code</option>
  <option value="countryDropDown">Country DropDown</option>
  <option value="deliveryOptions">Delivery Options</option>
  <option value="segmentedRadio">Segmented Radio</option>
  <option value="imageRadio">Image Radio</option>
  <option value="simpleDropdown">Simple Dropdown</option>
  <option value="checkbox">Checkbox</option>
  <option value="image">Image</option>
</select>
            <div className="space-x-2">
              <button
                onClick={() => addElement(pendingAdd.stepIdx, pendingAdd.groupIdx, newElementType)}
                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
              >
                Add
              </button>
              <button
                onClick={() => setPendingAdd(null)}
                className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : selectedNode ? (
          <div className="space-y-2">
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

            {'attributes' in selectedNode && (
              <div>
                <label className="block text-xs font-semibold">attributes</label>
                <pre className="bg-gray-100 rounded p-1 text-xs whitespace-pre-wrap">
                  {JSON.stringify(selectedNode.attributes, null, 2)}
                </pre>
              </div>
            )}
            {'validations' in selectedNode && (
              <div>
                <label className="block text-xs font-semibold">validations</label>
                <pre className="bg-gray-100 rounded p-1 text-xs whitespace-pre-wrap">
                  {JSON.stringify(selectedNode.validations, null, 2)}
                </pre>
              </div>
            )}
            {'dependency' in selectedNode && (
              <div>
                <label className="block text-xs font-semibold">dependency</label>
                <pre className="bg-gray-100 rounded p-1 text-xs whitespace-pre-wrap">
                  {JSON.stringify(selectedNode.dependency, null, 2)}
                </pre>
              </div>
            )}
            {'elementItems' in selectedNode && (
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