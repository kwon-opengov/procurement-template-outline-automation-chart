function makeNodeId(label) {
  return label.replace(/\W+/g, "_");
}

function generateDiagram() {
  const sectionsFile = document.getElementById('sectionsFile').files[0];
  const automationsFile = document.getElementById('automationsFile').files[0];

  if (!sectionsFile || !automationsFile) {
    alert("Please upload both JSON files.");
    return;
  }

  Promise.all([sectionsFile.text(), automationsFile.text()]).then(([sectionsText, automationsText]) => {
    const sectionsData = JSON.parse(sectionsText);
    const automationsData = JSON.parse(automationsText);
    const automationsBySection = {};

    automationsData.forEach(rule => {
      const id = rule.dataSectionId;
      if (!automationsBySection[id]) automationsBySection[id] = [];
      automationsBySection[id].push(rule);
    });

    let htmlOutput = "";
    sectionsData.sections.forEach(divider => {
      let mermaidLines = [
        "%%{ init: { 'theme': 'base', 'themeVariables': { " +
        "'background': '#ffffff', " +
        "'primaryColor': '#5069ff', 'secondaryColor': '#7f8ca0', " +
        "'primaryTextColor': '#ffffff', 'tertiaryColor': '#dce6f4', " +
        "'lineColor': '#f86a0b', 'fontFamily': 'DM Sans', 'fontSize': '24px' } } }%%",
        "graph LR",
        `subgraph ${makeNodeId("Divider_" + divider.divider)}["${divider.divider}"]`
      ];

      const nodeIds = {};
      divider.items.forEach(item => {
        const number = item.number.replace(/\.$/, '');
        const label = `${number} ${item.title} - ${item.alias} - ${item.dataSectionId}`;
        const nodeId = makeNodeId(label);
        nodeIds[item.dataSectionId] = nodeId;
        mermaidLines.push(`${nodeId}(["${label}"])`);
      });
      mermaidLines.push("end");

      const classStyles = [];
      for (const [dataId, rules] of Object.entries(automationsBySection)) {
        if (nodeIds[dataId]) {
          const targetNode = nodeIds[dataId];
          rules.forEach((rule, i) => {
            const decisionId = makeNodeId(`decision_${dataId}_${i}`);
            const text = `If\n${rule["Configuration Question"]}\n${rule.Condition} ${rule.Value}\nThen ${rule.Action}\n${rule["Section Item"]}`;
            mermaidLines.push(`${decisionId}{"${text}"}`);
            if (rule.Action === "SHOW") classStyles.push(`class ${decisionId} green;`);
            if (rule.Action === "HIDE") classStyles.push(`class ${decisionId} red;`);
            mermaidLines.push(`${decisionId} --> ${targetNode}`);
          });
        }
      }

      mermaidLines.push("classDef green stroke:#147a3d,stroke-width:10px;");
      mermaidLines.push("classDef red stroke:#d11e1e,stroke-width:10px;");
      mermaidLines.push(...classStyles);

      htmlOutput += `
        <div class="mermaid-container">
          <h2>${divider.divider}</h2>
          <pre class="mermaid">
${mermaidLines.join('\n')}
          </pre>
        </div>
      `;
    });

    document.getElementById("output").innerHTML = htmlOutput;
    mermaid.init();
  });
}