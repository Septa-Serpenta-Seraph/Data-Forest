// --- Global State Variables ---
let fileTreeData = []; 
let currentlyEditingNodeId = null;
let currentlyPreviewingNodeId = null;
let isDedicatedViewerOpen = false;
let dedicatedViewerCurrentNode = null;
let draggedNodeId = null; 
let dropIndicator = null; 

// --- Global Utility Functions ---
function generateNodeId() {
    return 'node-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function ensureNodeProperties(nodes) {
    nodes.forEach(node => {
        if (!node.nodeId) {
            node.nodeId = generateNodeId();
        }
        if (node.type === 'file' && node.content === undefined) {
            node.content = ''; 
        }
        if (node.type === 'folder' && node.children) {
            ensureNodeProperties(node.children);
        }
    });
}

function closeCurrentInlinePreview() {
    if (currentlyPreviewingNodeId) {
        const previewElement = document.querySelector(`.inline-preview-container[data-previewing-node-id="${currentlyPreviewingNodeId}"]`);
        if (previewElement) previewElement.remove();
        currentlyPreviewingNodeId = null;
    }
}

function closeDedicatedViewer() {
    const dedicatedViewerPanelGlobal = document.getElementById('dedicatedViewerPanel');
    const viewerPanelFileNameGlobal = document.getElementById('viewerPanelFileName');
    const viewerPanelContentGlobal = document.getElementById('viewerPanelContent');
    if (isDedicatedViewerOpen && dedicatedViewerPanelGlobal) {
        dedicatedViewerPanelGlobal.style.display = 'none';
        isDedicatedViewerOpen = false;
        if (viewerPanelFileNameGlobal) viewerPanelFileNameGlobal.textContent = '';
        if (viewerPanelContentGlobal) viewerPanelContentGlobal.textContent = '';
    }
}

function closeCurrentEditor() {
    if (currentlyEditingNodeId) {
        const editorElement = document.querySelector(`.editor-container[data-editing-node-id="${currentlyEditingNodeId}"]`);
        if (editorElement) editorElement.remove();
        currentlyEditingNodeId = null;
    }
}

function closeAllOverlays() {
    closeCurrentEditor();
    closeCurrentInlinePreview();
    closeDedicatedViewer();
}

function generateContentSnippet(fullContent, maxLines = 3, maxChars = 200) {
    if (!fullContent) return "";
    const lines = fullContent.split('\n');
    let snippet = lines.slice(0, maxLines).join('\n');
    if (snippet.length > maxChars) snippet = snippet.substring(0, maxChars) + '...';
    else if (lines.length > maxLines) snippet += '...';
    return snippet;
}

function copyNodeContentToClipboard(node) {
    if (!node || node.content === undefined) { console.error("Copy: Node or content undefined."); alert("Could not copy: data unavailable."); return; }
    navigator.clipboard.writeText(node.content)
        .then(() => alert(`Content of "${node.name}" copied!`))
        .catch(err => { console.error('Copy failed: ', err); alert(`Copy failed.`); });
}

function downloadNodeContent(node) {
    if (!node || node.content === undefined) { console.error("Download: Node or content undefined."); alert("Could not download: data unavailable."); return; }
    if (node.type !== 'file') { alert("Cannot download a folder."); return; }
    const filename = node.name || 'downloaded-file.txt';
    const blob = new Blob([node.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    alert(`Downloading "${filename}"...`);
}

function openDedicatedViewer(node) {
    console.log("openDedicatedViewer called with node:", node); 
    closeAllOverlays(); 
    dedicatedViewerCurrentNode = node; 
    isDedicatedViewerOpen = true; 
    const dedicatedViewerPanel = document.getElementById('dedicatedViewerPanel'); 
    const viewerPanelFileName = document.getElementById('viewerPanelFileName');
    const viewerPanelContent = document.getElementById('viewerPanelContent');
    const dedicatedViewerCopyButton = document.getElementById('viewerPanelCopyButton'); 
    const dedicatedViewerDownloadButton = document.getElementById('viewerPanelDownloadButton');
    if (!dedicatedViewerPanel || !viewerPanelFileName || !viewerPanelContent) { console.error("Dedicated viewer elements missing!"); return; }
    viewerPanelFileName.textContent = node.name;
    viewerPanelContent.textContent = node.content; 
    dedicatedViewerPanel.style.display = 'flex'; 
    if (dedicatedViewerCopyButton) dedicatedViewerCopyButton.onclick = () => { if (dedicatedViewerCurrentNode) copyNodeContentToClipboard(dedicatedViewerCurrentNode); };
    if (dedicatedViewerDownloadButton) dedicatedViewerDownloadButton.onclick = () => { if (dedicatedViewerCurrentNode) downloadNodeContent(dedicatedViewerCurrentNode); };
}

function findAndRemoveNode(nodesList, nodeId) {
    for (let i = 0; i < nodesList.length; i++) {
        if (nodesList[i].nodeId === nodeId) { nodesList.splice(i, 1); return true; }
        if (nodesList[i].type === 'folder' && nodesList[i].children && findAndRemoveNode(nodesList[i].children, nodeId)) return true;
    }
    return false;
}

function deleteNodeById(nodeIdToDelete) {
    if (findAndRemoveNode(fileTreeData, nodeIdToDelete)) {
        closeAllOverlays(); 
        const container = document.getElementById('fileTreeContainer');
        if (container) renderTree(fileTreeData, container, document.eventHandlers);
        else console.error("fileTreeContainer not found for re-render after delete.");
    } else console.warn("Node to delete not found:", nodeIdToDelete);
}

function sortTreeDataRecursive(nodes, sortType) {
    if (!nodes || nodes.length === 0) return;
    nodes.sort((a, b) => {
        if (sortType === 'name_asc') return a.name.localeCompare(b.name);
        if (sortType === 'name_desc') return b.name.localeCompare(a.name);
        if (sortType === 'type_then_name') {
            if (a.type === 'folder' && b.type === 'file') return -1;
            if (a.type === 'file' && b.type === 'folder') return 1;
            return a.name.localeCompare(b.name);
        }
        return 0;
    });
    nodes.forEach(node => {
        if (node.type === 'folder' && node.children) sortTreeDataRecursive(node.children, sortType);
    });
}

// --- Drag and Drop Helper Functions ---
function findNodeById(nodeId, nodes = fileTreeData) {
    // console.log(`findNodeById - Searching for ID: ${nodeId} in nodes:`, nodes.map(n => n.name));
    for (const node of nodes) {
        if (node.nodeId === nodeId) {
            // console.log(`findNodeById - Found node:`, JSON.parse(JSON.stringify(node)));
            return node;
        }
        if (node.type === 'folder' && node.children) {
            const found = findNodeById(nodeId, node.children);
            if (found) return found;
        }
    }
    // console.log(`findNodeById - Node ID: ${nodeId} not found.`);
    return null;
}

function findNodeDetails(nodeId, nodes = fileTreeData, parentList = fileTreeData, parentNode = null) {
    // console.log(`findNodeDetails - Searching for ID: ${nodeId} in nodes:`, nodes.map(n => n.name), 'Parent node name:', parentNode ? parentNode.name : 'ROOT');
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.nodeId === nodeId) {
            const result = { node, parentList, index: i, parentNode: (parentList === fileTreeData ? null : parentNode) };
            // console.log(`findNodeDetails - Found details for ID ${nodeId}:`, { nodeName: result.node.name, parentListName: result.parentNode ? result.parentNode.name : 'ROOT_LIST', index: result.index });
            return result;
        }
        if (node.type === 'folder' && node.children) {
            const found = findNodeDetails(nodeId, node.children, node.children, node);
            if (found) return found;
        }
    }
    // console.log(`findNodeDetails - Details for ID: ${nodeId} not found in current scope.`);
    return null;
}

function isDescendant(childId, parentId) {
    // console.log(`isDescendant - Checking if childId: ${childId} is descendant of parentId: ${parentId}`);
    const parentNode = findNodeById(parentId); // findNodeById has its own logging
    if (!parentNode || parentNode.type !== 'folder' || !parentNode.children) {
        // console.log(`isDescendant - Parent node ${parentId} not found, not a folder, or no children. Returning false.`);
        return false;
    }
    if (childId === parentId) {
        // console.log(`isDescendant - childId ${childId} is same as parentId ${parentId}. Returning true.`);
        return true; // A node is a descendant of itself for this check
    }
    function check(currentChildren) {
        for (const child of currentChildren) {
            if (child.nodeId === childId) return true;
            if (child.type === 'folder' && child.children && check(child.children)) return true;
        }
        return false;
    }
    return check(parentNode.children);
}

function moveNode(draggedNodeIdToMove, targetNodeId, position) {
    console.log(`moveNode - START. Dragged ID: ${draggedNodeIdToMove}, Target ID: ${targetNodeId}, Position: ${position}`);
    
    const draggedInfo = findNodeDetails(draggedNodeIdToMove); // findNodeDetails has logging
    if (!draggedInfo) { console.error(`moveNode - Dragged node info not found for ID: ${draggedNodeIdToMove}. Aborting move.`); return false; }
    console.log(`moveNode - Dragged Info:`, { name: draggedInfo.node.name, parent: draggedInfo.parentNode ? draggedInfo.parentNode.name : 'ROOT', index: draggedInfo.index });

    const { node: draggedNode, parentList: originalParentList, index: originalIndex } = draggedInfo;
    console.log(`moveNode - Original parentList (before splice):`, JSON.parse(JSON.stringify(originalParentList.map(n => n.name))));


    if (draggedNodeIdToMove === targetNodeId && position !== 'into') { 
        console.warn("moveNode - Cannot reorder a node relative to itself without 'into' a folder. Aborting."); return false;
    }

    if (position === 'into') {
        const targetParentNode = findNodeById(targetNodeId); // findNodeById has logging
        if (!targetParentNode || targetParentNode.type !== 'folder') { console.error(`moveNode - Target for 'into' (ID: ${targetNodeId}) is not a folder or not found. Aborting.`); return false; }
        if (draggedNodeIdToMove === targetNodeId) { console.warn("moveNode - Cannot drop a node into itself. Aborting."); return false; }
        if (draggedNode.type === 'folder' && isDescendant(targetNodeId, draggedNodeIdToMove)) { // isDescendant has logging
            alert("Cannot move a folder into one of its own subfolders."); 
            console.warn("moveNode - Attempt to move folder into its own descendant. Aborting."); return false; 
        }
        if (draggedInfo.parentNode && draggedInfo.parentNode.nodeId === targetNodeId) { 
            console.log("moveNode - Node is already in the target folder. No change needed."); return false; 
        }

        console.log(`moveNode ('into') - Splicing draggedNode '${draggedNode.name}' from originalParentList at index ${originalIndex}.`);
        originalParentList.splice(originalIndex, 1);
        if (!targetParentNode.children) targetParentNode.children = [];
        console.log(`moveNode ('into') - Pushing draggedNode '${draggedNode.name}' into targetParentNode '${targetParentNode.name}' children.`);
        targetParentNode.children.push(draggedNode);
        targetParentNode.isOpen = true;
        console.log(`moveNode ('into') - Target folder '${targetParentNode.name}' children after push:`, JSON.parse(JSON.stringify(targetParentNode.children.map(n => n.name))));
    } else { // Reordering: 'before' or 'after'
        const targetInfo = findNodeDetails(targetNodeId); // findNodeDetails has logging
        if (!targetInfo) { console.error(`moveNode - Target node info for reordering not found for ID: ${targetNodeId}. Aborting.`); return false; }
        console.log(`moveNode - Target Info for reorder:`, { name: targetInfo.node.name, parent: targetInfo.parentNode ? targetInfo.parentNode.name : 'ROOT', index: targetInfo.index });
        
        const { parentList: targetParentList, index: targetNodeIndex } = targetInfo;

        if (originalParentList === targetParentList) { 
            console.log(`moveNode (reorder) - Reordering within the same list ('${(targetInfo.parentNode ? targetInfo.parentNode.name : 'ROOT_LIST')}').`);
            if (originalIndex === targetNodeIndex && position === 'before') { console.log("moveNode - No change needed (already before itself)."); return false; }
            if (originalIndex === targetNodeIndex + 1 && position === 'after' && originalIndex > targetNodeIndex) { console.log("moveNode - No change needed (already after itself correctly)."); return false;}


            console.log(`moveNode (reorder) - Splicing draggedNode '${draggedNode.name}' from list at originalIndex ${originalIndex}.`);
            originalParentList.splice(originalIndex, 1);
            
            let newIndex = targetNodeIndex;
            // If moving down in the same list, and original was before target, target's effective index decreases by 1 after splice
            if (originalIndex < targetNodeIndex) {
                newIndex = targetNodeIndex -1; 
            }
            if (position === 'after') newIndex++;
            
            console.log(`moveNode (reorder) - Splicing draggedNode '${draggedNode.name}' into same list at newIndex ${newIndex}.`);
            targetParentList.splice(newIndex, 0, draggedNode);
            console.log(`moveNode (reorder) - Target list after reorder:`, JSON.parse(JSON.stringify(targetParentList.map(n => n.name))));
        } else { 
            console.log(`moveNode (reorder) - Moving to a different list (from '${draggedInfo.parentNode ? draggedInfo.parentNode.name : 'ROOT_LIST'}' to '${targetInfo.parentNode ? targetInfo.parentNode.name : 'ROOT_LIST'}').`);
            console.log(`moveNode (reorder) - Splicing draggedNode '${draggedNode.name}' from originalParentList at index ${originalIndex}.`);
            originalParentList.splice(originalIndex, 1);
            
            let newIndex = targetNodeIndex;
            if (position === 'after') newIndex++;
            console.log(`moveNode (reorder) - Splicing draggedNode '${draggedNode.name}' into new list at newIndex ${newIndex}.`);
            targetParentList.splice(newIndex, 0, draggedNode);
            console.log(`moveNode (reorder) - Target list after move:`, JSON.parse(JSON.stringify(targetParentList.map(n => n.name))));
        }
    }
    console.log(`moveNode - END. Move successful for ${draggedNode.name}.`);
    return true;
}

// --- Global Rendering Functions ---
function renderTreeRecursive(nodes, parentUlElement, handlers) { 
    nodes.forEach(node => {
        const li = document.createElement('li');
        li.setAttribute('data-node-id', node.nodeId);
        li.setAttribute('draggable', 'true'); 
        const nodeSpan = document.createElement('span');
        nodeSpan.classList.add('tree-node');
        nodeSpan.textContent = node.name;

        const deleteButton = document.createElement('span'); /* ... as before ... */ 
        deleteButton.textContent = ' 🗑️'; deleteButton.classList.add('delete-node-button'); deleteButton.title = `Delete ${node.name}`; deleteButton.style.cursor = 'pointer'; deleteButton.style.marginLeft = '5px';
        deleteButton.addEventListener('click', (e) => { e.stopPropagation(); if (confirm(node.type === 'folder' ? `Delete folder "${node.name}" and contents?` : `Delete file "${node.name}"?`)) deleteNodeById(node.nodeId); });

        if (node.type === 'folder') {
            nodeSpan.classList.add('folder-node'); /* ... as before ... */
            node.isOpen = node.isOpen === undefined ? false : node.isOpen; nodeSpan.classList.toggle('open', node.isOpen); nodeSpan.classList.toggle('closed', !node.isOpen);
            nodeSpan.addEventListener('click', (e) => { if (e.target === nodeSpan || e.target.classList.contains('folder-icon-span')) { node.isOpen = !node.isOpen; closeAllOverlays(); const c = document.getElementById('fileTreeContainer'); if (c) renderTree(fileTreeData, c, handlers); } });
            const addButton = document.createElement('span'); /* ... as before ... */
            addButton.textContent = ' [+]'; addButton.classList.add('add-node-button'); addButton.title = 'Add item'; addButton.addEventListener('click', (e) => { e.stopPropagation(); closeAllOverlays(); handlers.handleAddNodeToFolder(node); });
            nodeSpan.appendChild(addButton);
            nodeSpan.appendChild(deleteButton);
        } else { 
            nodeSpan.classList.add('file-node');
            const editButton = document.createElement('span'); /* ... as before ... */
            editButton.textContent = ' ✏️'; editButton.classList.add('edit-node-button'); editButton.title = 'Edit'; editButton.addEventListener('click', (e) => { e.stopPropagation(); handlers.handleEditFile(node, li); });
            nodeSpan.appendChild(editButton);
            nodeSpan.appendChild(deleteButton);
            nodeSpan.addEventListener('click', (e) => { if (e.target === nodeSpan) handlers.handleFileNodeClick(node, li); });
        }
        li.appendChild(nodeSpan);
        if (node.type === 'folder' && node.isOpen && node.children && node.children.length > 0) {
            const childrenUList = document.createElement('ul');
            renderTreeRecursive(node.children, childrenUList, handlers); 
            li.appendChild(childrenUList);
        }
        parentUlElement.appendChild(li);
    });
}

function renderTree(nodes, container, handlers) { 
    if (!container) { console.error("Render container not found!"); return; }
    container.innerHTML = '';
    const ul = document.createElement('ul');
    renderTreeRecursive(nodes, ul, handlers); 
    container.appendChild(ul);
}

document.addEventListener('DOMContentLoaded', () => {
    const fileTreeContainer = document.getElementById('fileTreeContainer');
    const addNewTreeButton = document.getElementById('addNewTreeButton');
    const viewerPanelCloseButton = document.getElementById('viewerPanelCloseButton'); 
    const sortOptionsSelect = document.getElementById('sortOptions');

    fileTreeData = [ /* ... initial data as before ... */ ];
    ensureNodeProperties(fileTreeData);

    const eventHandlers = { /* ... event handlers object as before ... */ };
    document.eventHandlers = eventHandlers; 

    addNewTreeButton.addEventListener('click', () => { /* ... */ });
    if (sortOptionsSelect) { /* ... */ }
    if (viewerPanelCloseButton) { /* ... */ }
    
    // Drag and Drop Event Listeners
    fileTreeContainer.addEventListener('dragstart', (event) => {
        const listItem = event.target.closest('li[draggable="true"]');
        if (!listItem) return;
        draggedNodeId = listItem.getAttribute('data-node-id');
        event.dataTransfer.setData('text/plain', draggedNodeId);
        event.dataTransfer.effectAllowed = 'move';
        listItem.classList.add('dragging'); 
        closeAllOverlays();
        const draggedNodeObject = findNodeById(draggedNodeId); // Find the actual node object
        console.log('Drag Start - ID:', draggedNodeId, 'Node Object:', JSON.parse(JSON.stringify(draggedNodeObject || {})));
    });

    fileTreeContainer.addEventListener('dragend', (event) => {
        if (dropIndicator) dropIndicator.remove(); 
        dropIndicator = null;
        const listItem = event.target.closest('li[draggable="true"]');
        if (listItem) listItem.classList.remove('dragging');
        else if (draggedNodeId) {
            const stillDraggedLi = fileTreeContainer.querySelector(`li[data-node-id="${draggedNodeId}"].dragging`);
            if (stillDraggedLi) stillDraggedLi.classList.remove('dragging');
        }
        draggedNodeId = null; 
        document.querySelectorAll('.drag-over-target').forEach(el => el.classList.remove('drag-over-target'));
        console.log('Drag End');
    });

    fileTreeContainer.addEventListener('dragover', (event) => {
        event.preventDefault(); 
        event.dataTransfer.dropEffect = 'move';
        const targetLi = event.target.closest('li[data-node-id]');
        
        // console.log('Drag Over - Raw event.target:', event.target); 

        document.querySelectorAll('.drag-over-target').forEach(el => el.classList.remove('drag-over-target'));
        if (dropIndicator) dropIndicator.remove();
        dropIndicator = null;

        if (!targetLi || !draggedNodeId) {
            // console.log('Drag Over - No targetLi or no draggedNodeId. Event Target:', event.target, 'Dragged ID:', draggedNodeId);
            return;
        }

        const targetNodeId = targetLi.getAttribute('data-node-id');
        // console.log(`Drag Over - TargetLi HTML (start):`, targetLi.outerHTML.substring(0, 150) + '...');
        // console.log(`Drag Over - Current Dragged ID: ${draggedNodeId}, Target Node ID: ${targetNodeId}`);
        
        const targetNode = findNodeById(targetNodeId); // findNodeById will be logged separately if we add logs there
        const currentlyDraggedNode = findNodeById(draggedNodeId); // findNodeById will be logged separately

        if (!currentlyDraggedNode || targetNodeId === draggedNodeId) {
            // console.log('Drag Over - No currentlyDraggedNode found OR targetNodeId is same as draggedNodeId.');
            return;
        }

        if (targetNode && targetNode.type === 'folder') {
            // Check if trying to drop a folder into its own descendant
            if (!(currentlyDraggedNode.type === 'folder' && isDescendant(targetNodeId, draggedNodeId))) {
                targetLi.classList.add('drag-over-target');
                // console.log('Drag Over - Target is folder, adding .drag-over-target class.');
                return; 
            }
        }
        
        const rect = targetLi.getBoundingClientRect();
        const offsetY = event.clientY - rect.top;
        const isTopHalf = offsetY < rect.height / 2;

        console.log(`Drag Over - Rect Top: ${rect.top.toFixed(2)}, Rect Height: ${rect.height.toFixed(2)}, ClientY: ${event.clientY.toFixed(2)}, OffsetY: ${offsetY.toFixed(2)}, IsTopHalf: ${isTopHalf}`);
        
        dropIndicator = document.createElement('div');
        dropIndicator.classList.add('drop-indicator');
        if (isTopHalf) {
            dropIndicator.classList.add('top');
            targetLi.parentNode.insertBefore(dropIndicator, targetLi); 
        } else {
            dropIndicator.classList.add('bottom');
            if (targetLi.nextSibling) targetLi.parentNode.insertBefore(dropIndicator, targetLi.nextSibling);
            else targetLi.parentNode.appendChild(dropIndicator);
        }
    });

    fileTreeContainer.addEventListener('dragleave', (event) => {
        const targetLi = event.target.closest('li[data-node-id]');
        if (targetLi && !targetLi.contains(event.relatedTarget)) {
            targetLi.classList.remove('drag-over-target');
        }
        // More robust cleanup of dropIndicator is in dragover and dragend
    });

    fileTreeContainer.addEventListener('drop', (event) => {
        event.preventDefault();
        if (dropIndicator) dropIndicator.remove();
        dropIndicator = null;
        document.querySelectorAll('.drag-over-target').forEach(el => el.classList.remove('drag-over-target'));

        const currentDraggedNodeId = draggedNodeId; 
        if (!currentDraggedNodeId) { console.warn("Drop Event - No currentDraggedNodeId at drop time."); return; }

        const targetLi = event.target.closest('li[data-node-id]');
        let success = false;
        let dropTargetNodeId = null;
        let dropPosition = null;

        console.log(`Drop Event - Dragged ID: ${currentDraggedNodeId}, Raw Event Target:`, event.target);

        if (targetLi) {
            dropTargetNodeId = targetLi.getAttribute('data-node-id');
            const targetNode = findNodeById(dropTargetNodeId); 
            console.log(`Drop Event - TargetLi found. Target Node ID: ${dropTargetNodeId}, Target Node:`, JSON.parse(JSON.stringify(targetNode || {})));

            if (targetNode && targetNode.type === 'folder' && event.target.classList.contains('tree-node') && event.target.closest('li') === targetLi) { 
                dropPosition = 'into';
                console.log(`Drop Event - Calculated position: 'into' folder. Target ID: ${dropTargetNodeId}`);
            } else { 
                const rect = targetLi.getBoundingClientRect();
                const offsetY = event.clientY - rect.top;
                dropPosition = offsetY < rect.height / 2 ? 'before' : 'after';
                console.log(`Drop Event - Calculated position: reorder '${dropPosition}' relative to Target ID: ${dropTargetNodeId}. OffsetY: ${offsetY.toFixed(2)}, Rect Height: ${rect.height.toFixed(2)}`);
            }
            
            console.log("Drop Event - fileTreeData BEFORE moveNode:", JSON.parse(JSON.stringify(fileTreeData)));
            success = moveNode(currentDraggedNodeId, dropTargetNodeId, dropPosition); 
            console.log(`Drop Event - moveNode call returned: ${success}`);
            console.log("Drop Event - fileTreeData AFTER moveNode:", JSON.parse(JSON.stringify(fileTreeData)));

        } else {
            console.warn("Drop Event - No targetLi found. Drop occurred in empty space or on an invalid part of the UI.");
        }

        if (success) {
            console.log("Drop Event - Re-rendering tree due to successful moveNode.");
            renderTree(fileTreeData, fileTreeContainer, document.eventHandlers);
        } else {
            console.warn("Drop Event - moveNode was not successful. Tree not re-rendered by drop handler.");
        }
        draggedNodeId = null; 
        console.log("Drop Event - draggedNodeId has been cleared.");
    });
    
    // Initial data load and render
    fileTreeData = [
        { nodeId: generateNodeId(), name: 'My Project', type: 'folder', isOpen: true, children: [
            { nodeId: generateNodeId(), name: 'README.md', type: 'file', content: 'This is a README file.' },
            { nodeId: generateNodeId(), name: 'src', type: 'folder', isOpen: true, children: [
                { nodeId: generateNodeId(), name: 'app.js', type: 'file', content: 'console.log("App started");' },
                { nodeId: generateNodeId(), name: 'utils.js', type: 'file', content: '// Utility functions' },
                { nodeId: generateNodeId(), name: 'components', type: 'folder', isOpen: false, children: [
                    { nodeId: generateNodeId(), name: 'Button.js', type: 'file', content: '// Button component' },
                    { nodeId: generateNodeId(), name: 'Modal.js', type: 'file', content: '// Modal component' }
                ]}
            ]},
            { nodeId: generateNodeId(), name: 'public', type: 'folder', isOpen: false, children: [
                { nodeId: generateNodeId(), name: 'index.html', type: 'file', content: '<html>...</html>' },
                { nodeId: generateNodeId(), name: 'favicon.ico', type: 'file', content: '' }
            ]},
            { nodeId: generateNodeId(), name: 'package.json', type: 'file', content: '{ "name": "my-project" }' }
        ]},
        { nodeId: generateNodeId(), name: 'Documents', type: 'folder', isOpen: false, children: [
            { nodeId: generateNodeId(), name: 'report.docx', type: 'file', content: 'Report content...' },
            { nodeId: generateNodeId(), name: 'notes.txt', type: 'file', content: 'My important notes.' }
        ]},
        { nodeId: generateNodeId(), name: 'image.png', type: 'file', content: '' },
        { nodeId: generateNodeId(), name: 'archive.zip', type: 'file', content: '' }
    ];
    ensureNodeProperties(fileTreeData);

    // Setup event handlers object (ensure all handlers are correctly defined here)
    document.eventHandlers = {
        handleFileNodeClick: function(node, listItemElement) {
            if (currentlyPreviewingNodeId === node.nodeId) { closeCurrentInlinePreview(); return; }
            closeAllOverlays(); currentlyPreviewingNodeId = node.nodeId;
            const previewContainer = document.createElement('div'); previewContainer.classList.add('inline-preview-container');
            previewContainer.setAttribute('data-previewing-node-id', node.nodeId);
            const contentDiv = document.createElement('div'); contentDiv.classList.add('inline-preview-content');
            contentDiv.textContent = generateContentSnippet(node.content); previewContainer.appendChild(contentDiv);
            const actionsDiv = document.createElement('div'); actionsDiv.classList.add('inline-preview-actions');
            const viewFullIcon = document.createElement('span'); viewFullIcon.classList.add('preview-action-icon'); viewFullIcon.textContent = '👁️'; viewFullIcon.title = 'View Full File'; viewFullIcon.addEventListener('click', (e) => { e.stopPropagation(); openDedicatedViewer(node); });
            const copyIcon = document.createElement('span'); copyIcon.classList.add('preview-action-icon'); copyIcon.textContent = '📋'; copyIcon.title = 'Copy Content'; copyIcon.addEventListener('click', (e) => { e.stopPropagation(); copyNodeContentToClipboard(node); });
            const downloadIcon = document.createElement('span'); downloadIcon.classList.add('preview-action-icon'); downloadIcon.textContent = '💾'; downloadIcon.title = 'Download File'; downloadIcon.addEventListener('click', (e) => { e.stopPropagation(); downloadNodeContent(node); });
            const editIconInPreview = document.createElement('span'); editIconInPreview.classList.add('preview-action-icon'); editIconInPreview.textContent = '✏️'; editIconInPreview.title = 'Edit File'; editIconInPreview.addEventListener('click', (e) => { e.stopPropagation(); closeCurrentInlinePreview(); this.handleEditFile(node, listItemElement); });
            const closePreviewIcon = document.createElement('span'); closePreviewIcon.classList.add('preview-action-icon'); closePreviewIcon.textContent = '❌'; closePreviewIcon.title = 'Close Preview'; closePreviewIcon.addEventListener('click', (e) => { e.stopPropagation(); closeCurrentInlinePreview(); });
            actionsDiv.appendChild(viewFullIcon); actionsDiv.appendChild(copyIcon); actionsDiv.appendChild(downloadIcon); actionsDiv.appendChild(editIconInPreview); actionsDiv.appendChild(closePreviewIcon);
            previewContainer.appendChild(actionsDiv); listItemElement.appendChild(previewContainer);
        },
        handleEditFile: function(node, listItemElement) {
            closeAllOverlays(); currentlyEditingNodeId = node.nodeId;
            const editorContainer = document.createElement('div'); editorContainer.classList.add('editor-container'); editorContainer.setAttribute('data-editing-node-id', node.nodeId);
            const textarea = document.createElement('textarea'); textarea.value = node.content; textarea.style.width = '95%'; textarea.style.minHeight = '80px'; textarea.style.marginTop = '5px';
            const saveButton = document.createElement('button'); saveButton.textContent = 'Save'; saveButton.style.marginRight = '5px'; saveButton.style.marginTop = '5px'; saveButton.addEventListener('click', () => { node.content = textarea.value; closeCurrentEditor(); });
            const cancelButton = document.createElement('button'); cancelButton.textContent = 'Cancel'; cancelButton.style.marginTop = '5px'; cancelButton.addEventListener('click', () => { closeCurrentEditor(); });
            editorContainer.appendChild(textarea); editorContainer.appendChild(saveButton); editorContainer.appendChild(cancelButton);
            listItemElement.appendChild(editorContainer); textarea.focus();
        },
        handleAddNodeToFolder: function(parentNode) {
            const name = prompt('Enter name for the new node:'); if (!name) return;
            let typeInput = prompt('Enter type for new node (file or folder):', 'file'); if (typeInput === null) return; 
            typeInput = typeInput.trim().toLowerCase(); let type;
            if (typeInput === 'folder') type = 'folder'; else if (typeInput === 'file') type = 'file';
            else { alert('Invalid type entered. Defaulting to "file".'); type = 'file'; }
            const newNode = { nodeId: generateNodeId(), name: name, type: type };
            if (type === 'folder') { newNode.children = []; newNode.isOpen = false; } else { newNode.content = ""; }
            if (!parentNode.children) parentNode.children = []; parentNode.children.push(newNode); parentNode.isOpen = true;
            renderTree(fileTreeData, fileTreeContainer, this); 
        }
    };

    addNewTreeButton.addEventListener('click', () => {
        const name = prompt('Enter name for the new root tree (folder):'); if (!name) return;
        const newTree = { nodeId: generateNodeId(), name: name, type: 'folder', isOpen: true, children: [] };
        fileTreeData.push(newTree);
        renderTree(fileTreeData, fileTreeContainer, document.eventHandlers); 
    });
    if (sortOptionsSelect) {
        sortOptionsSelect.addEventListener('change', (event) => {
            const sortBy = event.target.value; if (sortBy) { closeAllOverlays(); sortTreeDataRecursive(fileTreeData, sortBy); renderTree(fileTreeData, fileTreeContainer, document.eventHandlers); }
        });
    }
    if (viewerPanelCloseButton) {
        viewerPanelCloseButton.addEventListener('click', () => closeDedicatedViewer());
    } else { console.error("Dedicated viewer close button not found."); }
    
    renderTree(fileTreeData, fileTreeContainer, document.eventHandlers); 
});
