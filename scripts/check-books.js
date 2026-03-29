#!/usr/bin/env node

/**
 * Book validation script for Tarskido
 * Checks all published books for content issues using existing bookStore logic
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from '@dagrejs/graphlib';
const { Graph, alg } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BOOKS_DIR = path.resolve(__dirname, '../public/books');

function loadBook(bookPath) {
  try {
    const content = fs.readFileSync(bookPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to load ${bookPath}: ${error.message}`);
    return null;
  }
}

// Reimplemented from bookStore.ts nodeRefs function
function nodeRefs(node) {
  const refs = [];
  if (node.references) {
    refs.push(...node.references);
  }
  if (node.chapter) {
    refs.push(node.chapter);
  }
  
  // Also collect references from proof lines
  if (node.proof_lines) {
    for (const proofLine of node.proof_lines) {
      if (proofLine.references) {
        refs.push(...proofLine.references);
      }
    }
  }
  
  return refs;
}

// Reimplemented from bookStore.ts rebuildGraph function 
function buildBookGraph(book) {
  const g = new Graph({ directed: true, compound: true });
  g.setGraph({ label: '', rankDir: 'LR' });
  g.setNode('ROOT', { label: 'ROOT' });
  
  const edgeCount = { total: 0, invalid: 0 };
  const invalidRefs = [];
  
  Object.values(book.nodes || {}).forEach(node => {
    g.setNode(node.id, {
      ...node,
      label: node.nodetype.secondary + ' ' + node.reference + (node.name ? '\n' + node.name : ''),
    });
    
    const refs = nodeRefs(node);
    refs.forEach(ref => {
      edgeCount.total++;
      
      // Check if referenced node exists
      if (!book.nodes[ref] && ref !== 'ROOT') {
        edgeCount.invalid++;
        invalidRefs.push(`${node.id} → ${ref} (missing)`);
        return;
      }
      
      g.setEdge(ref, node.id, { label: '' });
    });
    g.setParent(node.id, node.chapter || 'ROOT');
  });
  
  return { graph: g, edgeCount, invalidRefs };
}

function checkCycles(bookName, graph) {
  const issues = [];
  

  
  // Check for direct node-to-node cycles
  const cycles = alg.findCycles(graph);
  
  console.log(`   🔍 Found ${cycles.length} cycles`);
  if (cycles.length > 0) {
    console.log(`   🔍 Cycles:`, cycles.slice(0, 3).map(c => c.join(' → ')));
  }
  
  if (cycles.length > 0) {
    issues.push({
      type: 'error',
      category: 'circular-dependencies',
      message: `Found ${cycles.length} circular dependencies`,
      details: cycles.map(cycle => cycle.join(' ↔ ')).slice(0, 10) // Limit output
    });
  }
  
  return issues;
}

function checkNodeIntegrity(bookName, book, graphResult) {
  const issues = [];
  const { graph, edgeCount, invalidRefs } = graphResult;
  
  // Report invalid references from graph building
  for (const invalidRef of invalidRefs) {
    issues.push({
      type: 'error',
      category: 'orphaned-reference',
      message: `Invalid reference: ${invalidRef}`
    });
  }
  
  // Check for isolated nodes (no edges, excluding ROOT)
  const isolatedNodes = graph.nodes().filter(nodeId => {
    if (nodeId === 'ROOT') return false;
    const edges = graph.nodeEdges(nodeId) || [];
    return edges.length === 0;
  });
  
  if (isolatedNodes.length > 0) {
    issues.push({
      type: 'warning',
      category: 'isolated-nodes',
      message: `Found ${isolatedNodes.length} isolated nodes`,
      details: isolatedNodes.slice(0, 10) // Limit details to first 10
    });
  }
  
  return issues;
}

function validateBook(bookPath) {
  const bookName = path.basename(bookPath, '.json');
  console.log(`\n📖 Checking ${bookName}...`);
  
  const book = loadBook(bookPath);
  if (!book) return [];
  
  const graphResult = buildBookGraph(book);
  const allIssues = [];
  
  // Run all checks
  allIssues.push(...checkCycles(bookName, graphResult.graph));
  allIssues.push(...checkNodeIntegrity(bookName, book, graphResult));
  
  // Report results
  const errors = allIssues.filter(issue => issue.type === 'error');
  const warnings = allIssues.filter(issue => issue.type === 'warning');
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log(`   ✅ No issues found`);
  } else {
    if (errors.length > 0) {
      console.log(`   🚨 ${errors.length} errors:`);
      for (const error of errors) {
        console.log(`      ${error.message}`);
        if (error.details) {
          for (const detail of error.details) {
            console.log(`        • ${detail}`);
          }
        }
      }
    }
    
    if (warnings.length > 0) {
      console.log(`   ⚠️  ${warnings.length} warnings:`);
      for (const warning of warnings) {
        console.log(`      ${warning.message}`);
        if (warning.details) {
          for (const detail of warning.details) {
            console.log(`        • ${detail}`);
          }
        }
      }
    }
  }
  
  return allIssues;
}

function main() {
  console.log('🔍 Tarskido Book Validation');
  console.log('============================');
  
  if (!fs.existsSync(BOOKS_DIR)) {
    console.error(`❌ Books directory not found: ${BOOKS_DIR}`);
    process.exit(1);
  }
  
  const bookFiles = fs.readdirSync(BOOKS_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(BOOKS_DIR, file));
    
  if (bookFiles.length === 0) {
    console.log('📭 No books found to validate');
    return;
  }
  
  let totalIssues = 0;
  let totalErrors = 0;
  
  for (const bookPath of bookFiles) {
    const issues = validateBook(bookPath);
    totalIssues += issues.length;
    totalErrors += issues.filter(issue => issue.type === 'error').length;
  }
  
  console.log('\n📊 Summary');
  console.log('===========');
  console.log(`Books checked: ${bookFiles.length}`);
  console.log(`Total issues: ${totalIssues}`);
  console.log(`Critical errors: ${totalErrors}`);
  
  if (totalErrors > 0) {
    console.log('\n🚨 Books with critical errors should be fixed before publication');
    process.exit(1);
  } else {
    console.log('\n✅ All books passed validation');
  }
}

main();