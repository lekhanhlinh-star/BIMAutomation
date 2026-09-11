import test from 'node:test';
import assert from 'node:assert/strict';
import { initialForm, changeView, applyPreset, toOptions } from '../src/state/renderForm.js';

test('no hidden style, climate or materials on first load', () => {
  const options = toOptions(initialForm('interior'));
  assert.equal(options.style, null); assert.equal(options.lighting, null);
  assert.equal(options.location_context, null); assert.deepEqual(options.additions, []);
});
test('switching view clears all scene-specific values and preserves project identity', () => {
  const form = { ...initialForm('interior'), project_name: 'PA01', view_name: 'View1', style: 'japandi',
    wall_material: 'Sơn', wall_material_location: 'Sau sofa', preservation_notes: 'Giữ sofa',
    space_type: 'Phòng khách', custom_prompt: 'Nội thất', additions: [{ item: 'Ghế', location: 'Góc trái' }] };
  const next = changeView(form, 'exterior');
  assert.equal(next.project_name, 'PA01'); assert.equal(next.view_name, 'View1');
  for (const key of ['style', 'wall_material', 'wall_material_location', 'space_type', 'preservation_notes', 'custom_prompt']) assert.equal(next[key], '');
  assert.deepEqual(next.additions, []);
});
test('preset is visible fill only, clearing fields remains empty in payload', () => {
  const preset = { id: 'exterior_neutral', style: 'modern', lighting: 'overcast' };
  const filled = applyPreset(initialForm('exterior'), preset);
  assert.equal(filled.style, 'modern'); assert.equal(filled.lighting, 'overcast');
  const options = toOptions({ ...filled, style: '', lighting: '' });
  assert.equal(options.style, null); assert.equal(options.lighting, null); assert.deepEqual(options.quick_tags, []);
});
test('custom materials and location preserved literally', () => {
  const options = toOptions({ ...initialForm('exterior'), wall_material: ' Đá xám ', wall_material_location: ' Ban công tầng 2 ' });
  assert.equal(options.wall_material, 'Đá xám'); assert.equal(options.wall_material_location, 'Ban công tầng 2');
});

test('fixed reference stays bound to its original image and view across later results', async () => {
  const { matchingReference } = await import('../src/state/renderForm.js');
  const source = { data: 'original-image' };
  const fixed = { render_id: 'first', source, metadata: { prompt_type: 'interior' } };
  assert.equal(matchingReference(fixed, { ...source }, 'interior'), fixed);
  assert.equal(matchingReference(fixed, { data: 'different-image' }, 'interior'), null);
  assert.equal(matchingReference(fixed, source, 'exterior'), null);
  assert.equal(matchingReference(fixed, null, 'interior'), null);
  assert.equal(matchingReference(null, source, 'interior'), null);
});
test('AI scene dressing is explicit in payload and does not fill materials', () => {
  const form = { ...initialForm('exterior'), geometry_mode: 'staged' };
  const options = toOptions(form);
  assert.equal(options.geometry_mode, 'staged');
  assert.equal(options.wall_material, null);
  assert.deepEqual(options.additions, []);
  assert.equal(toOptions(initialForm('exterior')).geometry_mode, 'strict');
});
