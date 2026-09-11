import pytest
from pydantic import ValidationError
from app.schemas.render import RenderOptions
from app.services.request_service import prepare_render, OptionError
from app.services.preset_service import PresetCatalog


@pytest.mark.parametrize('data', [{}, {'view_type': 'auto'}, {'view_type': 'INTERIOR'}, {'view_type': 'interior', 'geometry_mode': 'creative'},
    {'view_type': 'exterior', 'camera_perspective': 'drone_aerial'}, {'view_type': 'interior', 'design_stage': 'concept'},
    {'view_type': 'interior', 'additions': [{'item': 'Ghế', 'location': 'Góc trái'}]},
    {'view_type': 'interior', 'geometry_mode': 'balanced', 'additions': [{'item': 'Ghế', 'location': ' '}]},
    {'view_type': 'exterior', 'ceiling_material': 'Sơn'}, {'view_type': 'interior', 'roof_material': 'Ngói'},
    {'view_type': 'exterior', 'wall_material_location': 'Tầng 2'}, {'view_type': 'exterior', 'quick_tags': ['koi_pond']}])
def test_invalid_structured_options(data):
    with pytest.raises(ValidationError):
        RenderOptions.model_validate(data)


def test_empty_means_no_design_defaults():
    prepared = prepare_render(RenderOptions(view_type='exterior', style=' ', lighting='', quick_tags=[], preservation_elements=[]))
    options = prepared.effective_options
    assert options.style is None and options.lighting is None and options.additions == []
    assert options.environment_context is None
    assert options.camera_perspective == 'match_input_view'
    assert 'lock_roof' in options.preservation_elements


def test_archetype_never_merges_or_restores_cleared_fields():
    prepared = prepare_render(RenderOptions(view_type='exterior', archetype='exterior_neutral', style=None, lighting=None, quick_tags=[]))
    assert prepared.effective_options.style is None
    assert prepared.effective_options.lighting is None
    assert 'EXTERIOR AESTHETIC' not in prepared.prompt_used
    assert prepared.effective_options.quick_tags == []


@pytest.mark.parametrize('data', [
    {'style': 'vietnam_modern_apartment'}, {'style': 'old_preset_id'}, {'archetype': 'auto'},
    {'floor_material': 'floor_white_oak'}, {'wall_material': 'floor_flamed_basalt'},
    {'preservation_elements': ['lock_interior_shell']},
    {'geometry_mode': 'balanced', 'preservation_elements': ['lock_site_context'], 'additions': [{'item': 'Cây', 'location': 'Sân'}]},
])
def test_catalog_and_scope_conflicts(data):
    with pytest.raises(OptionError):
        prepare_render(RenderOptions(view_type='exterior', **data))


def test_catalog_is_valid_in_its_declared_scopes():
    catalog = PresetCatalog.get_catalog()
    assert [p.id for p in catalog.geometry_modes] == ['staged', 'strict', 'balanced']
    assert [p.id for p in catalog.view_types] == ['interior', 'exterior']
    for field, items in PresetCatalog.groups().items():
        for item in items:
            for view in ['interior', 'exterior'] if item.view_type == 'both' else [item.view_type]:
                prepared = prepare_render(RenderOptions(view_type=view, **{field: item.id}))
                assert item.prompt_hint in prepared.prompt_used
    assert catalog.quick_tags == []


def test_unselected_styles_cannot_add_pools_or_roofs():
    for item in PresetCatalog.EXTERIOR_STYLES + PresetCatalog.INTERIOR_STYLES:
        assert not any(word in item.prompt_hint.lower() for word in ['pool', 'mansard', 'sofa', 'hip roof', 'koi'])
