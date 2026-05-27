import { useEffect, useState } from "react";
import axios from "axios";
import ReactFlow from "reactflow";
import "reactflow/dist/style.css";

function App() {

  const [objects, setObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [details, setDetails] = useState(null);
  const [search, setSearch] = useState("");
  const [orgNodes, setOrgNodes] = useState([]);
  const [orgEdges, setOrgEdges] = useState([]);
  const [impactedObjects, setImpactedObjects] = useState([]);

  useEffect(() => {

    fetchObjects();
    fetchOrgRelationships();


  }, []);

  const fetchObjects = async () => {

    try {

      const response = await axios.get(
        "http://127.0.0.1:5000/objects"
      );

      setObjects(response.data.objects);

    } catch (error) {

      console.error(error);
    }
  };

  const fetchOrgRelationships = async () => {

  try {

    const response = await axios.get(
      "http://127.0.0.1:5000/org-relationships"
    );

    const uniqueNodes = new Map();

      response.data.nodes.forEach((node) => {

      uniqueNodes.set(node.id, node);

    });

    const graphNodes =
  Array.from(uniqueNodes.values()).map((node, index) => ({

    id: node.id,

    data: {
      label: node.label
    },

    position: {
      x: 150 + ((index % 4) * 300),
      y: 100 + (Math.floor(index / 4) * 220)
    }

  }));

    const graphEdges =
      response.data.edges.map((edge, index) => ({

        id: `${edge.source}-${edge.target}-${index}`,

        source: edge.source,

        target: edge.target,

        label: `${edge.field} (${edge.relationshipType})`,

        animated: true,

        style: {
          stroke: "#60a5fa"
        },

        labelStyle: {
          fill: "white",
          fontSize: 12
        }

      }));

    setOrgNodes(graphNodes);

    setOrgEdges(graphEdges);

  } catch (error) {

    console.error(error);
  }
};

  const fetchObjectDetails = async (objectName) => {

    try {

      setSelectedObject(objectName);

      const impacted = orgEdges
      .filter(
      (edge) =>
      edge.target === objectName
      )
      .map((edge) => edge.source);

setImpactedObjects(impacted);

      const response = await axios.get(
        `http://127.0.0.1:5000/object/${objectName}`
      );

      setDetails(response.data.details);

    } catch (error) {

      console.error(error);
    }
  };

  const filteredObjects = objects.filter((obj) =>
    obj.toLowerCase().includes(search.toLowerCase())
  );

  const nodes = [];
const edges = [];

if (details) {

  nodes.push({
    id: details.objectName,
    data: {
      label: details.objectName
    },
    position: {
      x: 250,
      y: 100
    }
  });

  details.relationships.forEach((rel, index) => {

    const target =
      rel.references[0];

    nodes.push({
      id: target,
      data: {
        label: target
      },
      position: {
        x: 100 + (index * 200),
        y: 300
      }
    });

    edges.push({
      id: `${details.objectName}-${target}`,
      source: details.objectName,
      target: target,
      animated: true
    });

  });
}

  return (

    <div className="flex h-screen bg-gray-950 text-white">

      {/* SIDEBAR */}

      <div className="w-80 bg-gray-900 border-r border-gray-800 p-5 overflow-y-auto">

        <h1 className="text-2xl font-bold mb-6">
          Org Insight Engine
        </h1>

        <input
          type="text"
          placeholder="Search objects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 mb-6 outline-none"
        />

        <div className="space-y-3">

          {filteredObjects.map((obj) => (

            <div
              key={obj}
              onClick={() => fetchObjectDetails(obj)}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200
              ${
                selectedObject === obj
                  ? "bg-blue-600"
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              {obj}
            </div>

          ))}

        </div>

      </div>

      {/* MAIN CONTENT */}

      <div className="flex-1 p-8 overflow-y-auto">

        

        {/* OBJECT DETAILS */}

        {details ? (

          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">

            <h2 className="text-3xl font-bold mb-2">
              {details.label}
            </h2>

            <p className="text-gray-400 mb-8">
              API Name: {details.objectName}
            </p>
          
          {/* IMPACT ANALYSIS */}

<div className="mb-8">

  <h3 className="text-xl font-semibold mb-4">
    Impact Analysis
  </h3>

  {impactedObjects.length > 0 ? (

    <div className="flex flex-wrap gap-4">

      {impactedObjects.map((obj, index) => (

        <div
          key={index}
          className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-3"
        >

          <p className="font-medium text-red-300">
            {obj}
          </p>

        </div>

      ))}

    </div>

  ) : (

    <p className="text-gray-400">
      No incoming dependencies detected.
    </p>

  )}

</div>

            {/* RELATIONSHIPS */}

{details.relationships.length > 0 && (

  <div className="mb-8">

    <h3 className="text-xl font-semibold mb-4">
      Relationships
    </h3>

    <div className="flex flex-wrap gap-4">

      {details.relationships.map((rel, index) => (

        <div
          key={index}
          className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3"
        >

          <p className="text-sm text-gray-400 mb-1">
            {rel.field}
          </p>

          <p className="font-medium text-blue-400">
            →
            {" "}
            {rel.references.join(", ")}
          </p>

        </div>

      ))}

    </div>

  </div>

)}

{/* RELATIONSHIP GRAPH */}

<div className="h-[400px] bg-gray-950 rounded-2xl border border-gray-800 mb-8">

  <ReactFlow
    nodes={nodes}
    edges={edges}
    fitView
  />

</div>

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>

                  <tr className="border-b border-gray-800 text-left">

                    <th className="pb-4">Field Name</th>
                    <th className="pb-4">Label</th>
                    <th className="pb-4">Type</th>
                    <th className="pb-4">Relationship</th>

                  </tr>

                </thead>

                <tbody>

                  {details.fields.map((field) => (

                    <tr
                      key={field.name}
                      className="border-b border-gray-800"
                    >

                      <td className="py-4">
                        {field.name}
                      </td>

                      <td className="py-4">
                        {field.label}
                      </td>

                      <td className="py-4">

                        <span className="px-3 py-1 rounded-full bg-gray-800 text-sm">
                          {field.type}
                        </span>

                      </td>

                      <td className="py-4">

                        {field.referenceTo
                          ? field.referenceTo.join(", ")
                          : "-"}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        ) : (

          <div className="h-full flex items-center justify-center text-gray-500 text-2xl">
            Select an object to view metadata
          </div>

        )}

      </div>

    </div>
  );
}

export default App;