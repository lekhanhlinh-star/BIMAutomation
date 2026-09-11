export function initialForm(view = '') {
  return {
    view_type: view, geometry_mode: 'strict', quality: 'preview_1k',
    project_name: '', view_name: '', space_type: '', location_context: '',
    render_purpose: 'internal_review', preservation_notes: '', custom_prompt: '',
    archetype: null, style: '', lighting: '', environment_context: '', material_mood: '',
    wall_material: '', wall_material_location: '', floor_material: '', floor_material_location: '',
    ceiling_material: '', ceiling_material_location: '', roof_material: '', roof_material_location: '',
    door_material: '', door_material_location: '', trim_material: '', trim_material_location: '',
    railing_material: '', railing_material_location: '', additions: [],
  };
}
export function changeView(form, view) {
  return { ...initialForm(view), project_name: form.project_name, view_name: form.view_name,
    render_purpose: form.render_purpose, quality: form.quality, geometry_mode: form.geometry_mode };
}
export function applyPreset(form, preset) {
  if (!preset) return { ...form, archetype: null }; // clearing attribution never resurrects values
  return { ...form, archetype: preset.id, style: preset.style || '', lighting: preset.lighting || '',
    material_mood: preset.material_mood || '', environment_context: preset.environment_context || '' };
}
export function toOptions(form) {
  return { ...Object.fromEntries(Object.entries(form).map(([key, value]) => [key, typeof value === 'string' ? value.trim() || null : value])),
    camera_perspective: 'match_input_view', preservation_elements: [], quick_tags: [],
    additions: form.additions.map(a => ({ item: a.item.trim(), location: a.location.trim() })),
  };
}

export function matchingReference(reference, source, view) {
  return reference && source && reference.source.data === source.data
    && reference.metadata.prompt_type === view ? reference : null;
}
