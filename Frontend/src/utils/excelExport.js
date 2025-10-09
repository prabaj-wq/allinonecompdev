/**
 * Excel Export Utility for Universal Dimensions Template
 * Exports hierarchies and elements in a structured Excel format
 */

import * as XLSX from 'xlsx';

/**
 * Export hierarchy data to Excel with tree structure
 * @param {Array} hierarchies - Array of hierarchy objects
 * @param {Array} elements - Array of element objects
 * @param {string} dimensionType - Type of dimension (Entity, Account, etc.)
 * @param {string} filename - Name of the Excel file
 */
export const exportHierarchyToExcel = (hierarchies, elements, dimensionType, filename = 'export') => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // 1. Export Hierarchies Sheet
    const hierarchyData = buildHierarchyTreeData(hierarchies);
    const hierarchySheet = XLSX.utils.json_to_sheet(hierarchyData);
    XLSX.utils.book_append_sheet(workbook, hierarchySheet, 'Hierarchies');

    // 2. Export Elements Sheet
    const elementData = buildElementData(elements);
    const elementSheet = XLSX.utils.json_to_sheet(elementData);
    XLSX.utils.book_append_sheet(workbook, elementSheet, 'Elements');

    // 3. Export Tree Structure Sheet (for visualization)
    const treeData = buildTreeStructureData(hierarchies, elements);
    const treeSheet = XLSX.utils.json_to_sheet(treeData);
    XLSX.utils.book_append_sheet(workbook, treeSheet, 'Tree Structure');

    // 4. Export Summary Sheet
    const summaryData = buildSummaryData(hierarchies, elements, dimensionType);
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Set column widths for better formatting
    setColumnWidths(workbook);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fullFilename = `${dimensionType}_${filename}_${timestamp}.xlsx`;

    // Save the file
    XLSX.writeFile(workbook, fullFilename);

    return {
      success: true,
      filename: fullFilename,
      message: 'Export completed successfully'
    };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return {
      success: false,
      error: error.message,
      message: 'Export failed'
    };
  }
};

/**
 * Build hierarchy tree data for Excel export
 */
const buildHierarchyTreeData = (hierarchies) => {
  const data = [];
  
  const processHierarchy = (hierarchy, level = 0, parentPath = '') => {
    const currentPath = parentPath ? `${parentPath} > ${hierarchy.name}` : hierarchy.name;
    
    data.push({
      'Level': level,
      'Hierarchy Name': hierarchy.name,
      'Description': hierarchy.description || '',
      'Parent Path': parentPath,
      'Full Path': currentPath,
      'Sort Order': hierarchy.sort_order || 0,
      'Is Active': hierarchy.is_active ? 'Yes' : 'No',
      'Created At': hierarchy.created_at ? new Date(hierarchy.created_at).toLocaleDateString() : '',
      'Created By': hierarchy.created_by || ''
    });

    // Process children recursively
    if (hierarchy.children && hierarchy.children.length > 0) {
      hierarchy.children.forEach(child => {
        processHierarchy(child, level + 1, currentPath);
      });
    }
  };

  hierarchies.forEach(hierarchy => {
    processHierarchy(hierarchy);
  });

  return data;
};

/**
 * Build element data for Excel export
 */
const buildElementData = (elements) => {
  return elements.map(element => ({
    'Element Code': element.code,
    'Element Name': element.name,
    'Element Type': element.type || '',
    'Status': element.status || 'Active',
    'Hierarchy': element.hierarchy_name || '',
    'Parent Element': element.parent_element_name || '',
    'Level': element.level || 0,
    'Sort Order': element.sort_order || 0,
    'Is Active': element.is_active ? 'Yes' : 'No',
    'Custom Fields': element.custom_fields ? JSON.stringify(element.custom_fields) : '',
    'Created At': element.created_at ? new Date(element.created_at).toLocaleDateString() : '',
    'Created By': element.created_by || '',
    'Updated At': element.updated_at ? new Date(element.updated_at).toLocaleDateString() : '',
    'Updated By': element.updated_by || ''
  }));
};

/**
 * Build tree structure data for visualization
 */
const buildTreeStructureData = (hierarchies, elements) => {
  const data = [];
  
  const processTree = (hierarchy, level = 0, parentPath = '') => {
    const currentPath = parentPath ? `${parentPath} > ${hierarchy.name}` : hierarchy.name;
    const indent = '  '.repeat(level);
    
    // Add hierarchy row
    data.push({
      'Type': 'Hierarchy',
      'Level': level,
      'Name': `${indent}📁 ${hierarchy.name}`,
      'Code': '',
      'Description': hierarchy.description || '',
      'Path': currentPath,
      'Children Count': hierarchy.children ? hierarchy.children.length : 0,
      'Elements Count': elements.filter(el => el.hierarchy_id === hierarchy.id).length
    });

    // Add elements for this hierarchy
    const hierarchyElements = elements.filter(el => el.hierarchy_id === hierarchy.id);
    hierarchyElements.forEach(element => {
      data.push({
        'Type': 'Element',
        'Level': level + 1,
        'Name': `${indent}  📄 ${element.name}`,
        'Code': element.code,
        'Description': element.type || '',
        'Path': `${currentPath} > ${element.name}`,
        'Children Count': 0,
        'Elements Count': 0
      });
    });

    // Process children recursively
    if (hierarchy.children && hierarchy.children.length > 0) {
      hierarchy.children.forEach(child => {
        processTree(child, level + 1, currentPath);
      });
    }
  };

  hierarchies.forEach(hierarchy => {
    processTree(hierarchy);
  });

  return data;
};

/**
 * Build summary data
 */
const buildSummaryData = (hierarchies, elements, dimensionType) => {
  const totalHierarchies = countTotalHierarchies(hierarchies);
  const totalElements = elements.length;
  const activeElements = elements.filter(el => el.is_active).length;
  const inactiveElements = totalElements - activeElements;

  return [
    { 'Metric': 'Dimension Type', 'Value': dimensionType },
    { 'Metric': 'Export Date', 'Value': new Date().toLocaleString() },
    { 'Metric': 'Total Hierarchies', 'Value': totalHierarchies },
    { 'Metric': 'Total Elements', 'Value': totalElements },
    { 'Metric': 'Active Elements', 'Value': activeElements },
    { 'Metric': 'Inactive Elements', 'Value': inactiveElements },
    { 'Metric': 'Elements by Type', 'Value': getElementsByType(elements) },
    { 'Metric': 'Max Hierarchy Depth', 'Value': getMaxHierarchyDepth(hierarchies) }
  ];
};

/**
 * Count total hierarchies including children
 */
const countTotalHierarchies = (hierarchies) => {
  let count = 0;
  
  const countRecursive = (hierarchy) => {
    count++;
    if (hierarchy.children && hierarchy.children.length > 0) {
      hierarchy.children.forEach(child => countRecursive(child));
    }
  };

  hierarchies.forEach(hierarchy => countRecursive(hierarchy));
  return count;
};

/**
 * Get elements grouped by type
 */
const getElementsByType = (elements) => {
  const typeCount = {};
  elements.forEach(element => {
    const type = element.type || 'Unknown';
    typeCount[type] = (typeCount[type] || 0) + 1;
  });
  
  return Object.entries(typeCount)
    .map(([type, count]) => `${type}: ${count}`)
    .join(', ');
};

/**
 * Get maximum hierarchy depth
 */
const getMaxHierarchyDepth = (hierarchies) => {
  let maxDepth = 0;
  
  const getDepth = (hierarchy, currentDepth = 0) => {
    maxDepth = Math.max(maxDepth, currentDepth);
    if (hierarchy.children && hierarchy.children.length > 0) {
      hierarchy.children.forEach(child => getDepth(child, currentDepth + 1));
    }
  };

  hierarchies.forEach(hierarchy => getDepth(hierarchy));
  return maxDepth;
};

/**
 * Set column widths for better Excel formatting
 */
const setColumnWidths = (workbook) => {
  const sheets = ['Hierarchies', 'Elements', 'Tree Structure', 'Summary'];
  
  sheets.forEach(sheetName => {
    if (workbook.Sheets[sheetName]) {
      const sheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(sheet['!ref']);
      
      // Set default column widths
      const colWidths = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        colWidths[col] = { wch: 15 }; // Default width
      }
      
      // Set specific column widths based on content
      if (sheetName === 'Hierarchies') {
        colWidths[1] = { wch: 25 }; // Hierarchy Name
        colWidths[2] = { wch: 30 }; // Description
        colWidths[4] = { wch: 40 }; // Full Path
      } else if (sheetName === 'Elements') {
        colWidths[0] = { wch: 15 }; // Element Code
        colWidths[1] = { wch: 25 }; // Element Name
        colWidths[9] = { wch: 30 }; // Custom Fields
      } else if (sheetName === 'Tree Structure') {
        colWidths[2] = { wch: 35 }; // Name
        colWidths[5] = { wch: 50 }; // Path
      } else if (sheetName === 'Summary') {
        colWidths[0] = { wch: 20 }; // Metric
        colWidths[1] = { wch: 30 }; // Value
      }
      
      sheet['!cols'] = colWidths;
    }
  });
};

/**
 * Export selected elements only
 */
export const exportSelectedElements = (selectedElements, dimensionType, filename = 'selected_elements') => {
  try {
    const workbook = XLSX.utils.book_new();
    
    const elementData = selectedElements.map(element => ({
      'Element Code': element.code,
      'Element Name': element.name,
      'Element Type': element.type || '',
      'Status': element.status || 'Active',
      'Hierarchy': element.hierarchy_name || '',
      'Custom Fields': element.custom_fields ? JSON.stringify(element.custom_fields) : '',
      'Created At': element.created_at ? new Date(element.created_at).toLocaleDateString() : '',
      'Updated At': element.updated_at ? new Date(element.updated_at).toLocaleDateString() : ''
    }));

    const sheet = XLSX.utils.json_to_sheet(elementData);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Selected Elements');

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fullFilename = `${dimensionType}_${filename}_${timestamp}.xlsx`;

    XLSX.writeFile(workbook, fullFilename);

    return {
      success: true,
      filename: fullFilename,
      message: `Exported ${selectedElements.length} selected elements`
    };
  } catch (error) {
    console.error('Error exporting selected elements:', error);
    return {
      success: false,
      error: error.message,
      message: 'Export failed'
    };
  }
};

/**
 * Export hierarchy with A, B, C column structure as requested
 * A = node, B = children, C = sub-nodes, D = elements, etc.
 */
export const exportHierarchyWithColumnStructure = (hierarchies, elements, dimensionType, filename = 'hierarchy_export') => {
  try {
    const workbook = XLSX.utils.book_new();
    const hierarchicalData = [];
    
    hierarchies.forEach(hierarchy => {
      // Add hierarchy as main node (Column A)
      hierarchicalData.push({
        'A - Main Node': hierarchy.name,
        'B - Sub Nodes': '',
        'C - Sub-Sub Nodes': '',
        'D - Elements': '',
        'E - Type': 'Hierarchy',
        'F - Status': hierarchy.status || 'Active',
        'G - Description': hierarchy.description || '',
        'H - Code': hierarchy.code || '',
        'I - Created': hierarchy.created_at || new Date().toISOString().split('T')[0]
      });
      
      // Add elements under this hierarchy (Column D)
      const hierarchyElements = elements.filter(el => el.hierarchy === hierarchy.name);
      hierarchyElements.forEach(element => {
        hierarchicalData.push({
          'A - Main Node': '',
          'B - Sub Nodes': '',
          'C - Sub-Sub Nodes': '',
          'D - Elements': element.name,
          'E - Type': 'Element',
          'F - Status': element.status || 'Active',
          'G - Description': element.description || '',
          'H - Code': element.code || '',
          'I - Created': element.created_at || new Date().toISOString().split('T')[0]
        });
      });
    });
    
    const worksheet = XLSX.utils.json_to_sheet(hierarchicalData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hierarchy Structure');
    
    // Auto-size columns for better readability
    const colWidths = [
      { wch: 25 }, // A - Main Node
      { wch: 20 }, // B - Sub Nodes
      { wch: 20 }, // C - Sub-Sub Nodes
      { wch: 25 }, // D - Elements
      { wch: 15 }, // E - Type
      { wch: 12 }, // F - Status
      { wch: 35 }, // G - Description
      { wch: 15 }, // H - Code
      { wch: 12 }  // I - Created
    ];
    worksheet['!cols'] = colWidths;
    
    // Add header styling
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "366092" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
    
    // Apply header styling to first row
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = headerStyle;
    }
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fullFilename = `${dimensionType}_${filename}_${timestamp}.xlsx`;
    
    XLSX.writeFile(workbook, fullFilename);
    
    return {
      success: true,
      filename: fullFilename,
      message: 'Hierarchical export completed successfully'
    };
  } catch (error) {
    console.error('Error exporting hierarchy with column structure:', error);
    return {
      success: false,
      error: error.message,
      message: 'Export failed'
    };
  }
};

/**
 * Import data from Excel file
 */
export const importFromExcel = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const result = {
          hierarchies: [],
          elements: [],
          errors: []
        };

        // Process each sheet
        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          
          if (sheetName === 'Hierarchies') {
            result.hierarchies = jsonData;
          } else if (sheetName === 'Elements') {
            result.elements = jsonData;
          }
        });

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};
