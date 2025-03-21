/*
 * Parse input XML and convert it into steps.
 * Eg: Input - 
 * <boltArtifact id=\"project-import\" title=\"Project Files\">
 *  <boltAction type=\"file\" filePath=\"eslint.config.js\">
 *      import js from '@eslint/js';\nimport globals from 'globals';\n
 *  </boltAction>
 * <boltAction type="shell">
 *      node index.js
 * </boltAction>
 * </boltArtifact>
 * 
 * Output - 
 * [{
 *      title: "Project Files",
 *      status: "Pending"
 * }, {
 *      title: "Create eslint.config.js",
 *      type: StepType.CreateFile,
 *      code: "import js from '@eslint/js';\nimport globals from 'globals';\n"
 * }, {
 *      title: "Run command",
 *      code: "node index.js",
 *      type: StepType.RunScript
 * }]
 * 
 * The input can have strings in the middle they need to be ignored
 */

// StepType enum is now a plain object in JavaScript
export const StepType = {
    CreateFile: 0,
    CreateFolder: 1,
    EditFile: 2,
    DeleteFile: 3,
    RunScript: 4
};

// The parseXml function in JavaScript
export function parseXml(response) {
    // Extract the XML content between <boltArtifact> tags
    const xmlMatch = response.match(/<boltArtifact[^>]*>([\s\S]*?)<\/boltArtifact>/);

    if (!xmlMatch) {
        return [];
    }

    const xmlContent = xmlMatch[1];
    const steps = [];
    let stepId = 1;

    // Extract artifact title
    const titleMatch = response.match(/title="([^"]*)"/);
    const artifactTitle = titleMatch ? titleMatch[1] : 'Project Files';

    // Add initial artifact step
    steps.push({
        id: stepId++,
        title: artifactTitle,
        description: '',
        type: StepType.CreateFolder,
        status: 'pending'
    });

    // Regular expression to find boltAction elements
    const actionRegex = /<boltAction\s+type="([^"]*)"(?:\s+filePath="([^"]*)")?>([\s\S]*?)<\/boltAction>/g;

    let match;
    while ((match = actionRegex.exec(xmlContent)) !== null) {
        const [, type, filePath, content] = match;

        if (type === 'file') {
            // File creation step
            steps.push({
                id: stepId++,
                title: `Create ${filePath || 'file'}`,
                description: '',
                type: StepType.CreateFile,
                status: 'pending',
                code: content.trim(),
                path: filePath
            });
        } else if (type === 'shell') {
            // Shell command step
            steps.push({
                id: stepId++,
                title: 'Run command',
                description: '',
                type: StepType.RunScript,
                status: 'pending',
                code: content.trim()
            });
        }
    }

    return steps;
}

// Export the necessary parts for usage elsewhere
// module.exports = { parseXml, StepType };