const fs = require('fs');

console.log('Reading snapshot.json...');
const snap = JSON.parse(fs.readFileSync('server/snapshot.json', 'utf8'));

console.log('=== REAL DATABASE SUMMARY ===');
console.log('1. Projects count:', snap.projects ? snap.projects.length : 0);
if (snap.projects) {
  snap.projects.forEach((p, idx) => {
    const items = p.items || [];
    const totalArea = items.reduce((sum, it) => sum + ((it.inputWidth || 0) * (it.inputHeight || 0) * (it.quantity || 1)) / 1e6, 0);
    const totalPerimeter = items.reduce((sum, it) => sum + 2 * ((it.inputWidth || 0) + (it.inputHeight || 0)) * (it.quantity || 1) / 1e3, 0);
    console.log(`   Project #${idx + 1}: "${p.name}" (Client: ${p.client}, Location: ${p.location}, Year: ${p.year})`);
    console.log(`     - Items (Openings): ${items.length}`);
    console.log(`     - Total Glazing Surface Area: ${totalArea.toFixed(2)} m²`);
    console.log(`     - Total Frame Perimeter: ${totalPerimeter.toFixed(2)} linear meters`);
    items.forEach((it, iIdx) => {
      const area = ((it.inputWidth || 0) * (it.inputHeight || 0) * (it.quantity || 1)) / 1e6;
      console.log(`       [${iIdx + 1}] ${it.name} | ${it.inputWidth}x${it.inputHeight} mm | Qty: ${it.quantity || 1} | Area: ${area.toFixed(2)} m² | System: ${it.assemblyPage || it.sourceId} | Glass: ${it.glassLabel || 'N/A'}`);
    });
  });
}

console.log('2. Execution Projects count:', snap.executionProjects ? snap.executionProjects.length : 0);
if (snap.executionProjects) {
  snap.executionProjects.forEach((ep, idx) => {
    console.log(`   Execution Project #${idx + 1}: "${ep.name}" | Files: ${(ep.files || []).length}`);
  });
}

console.log('3. Materials Catalog:', snap.materials ? snap.materials.length : 0, 'items');
const catMap = {};
(snap.materials || []).forEach(m => {
  catMap[m.category] = (catMap[m.category] || 0) + 1;
});
console.log('   Categories breakdown:', catMap);

console.log('4. Standard Assemblies:', (snap.assemblies || []).map(a => `${a.name} (${(a.parts || []).length} parts)`));
console.log('5. Databases:', (snap.componentDatabases || []).map(d => d.name));
console.log('6. Company Databases:', (snap.companyDatabases || []).map(d => d.name));
console.log('7. Company Price Tables:', (snap.companyPriceTables || []).map(t => t.name));
console.log('8. Markup Rules:', (snap.markupRates || []).length, 'rates');
console.log('9. Manpower Labor Costs:', (snap.manpowerCosts || []).map(c => `${c.name}: $${c.rate}/hr`));
console.log('10. Shipping Logistics Costs:', (snap.shippingCosts || []).length, 'rates across', (snap.shippingTypes || []).map(t => t.name));
