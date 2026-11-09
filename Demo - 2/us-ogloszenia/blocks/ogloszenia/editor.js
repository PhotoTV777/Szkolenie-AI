( function ( blocks, blockEditor, components, element, serverSideRender, i18n ) {
	const { registerBlockType } = blocks;
	const { InspectorControls, useBlockProps } = blockEditor;
	const { PanelBody, RangeControl } = components;
	const { createElement: el, Fragment } = element;
	const ServerSideRender = serverSideRender;
	const { __, sprintf } = i18n;

	const MAX_LIMIT = 100;

	registerBlockType( 'us-ogloszenia/ogloszenia', {
		edit: function Edit( props ) {
			const { attributes, setAttributes } = props;
			const blockProps = useBlockProps( { className: 'us-ogloszenia-block-editor' } );

			const limit = typeof attributes.limit === 'number' ? attributes.limit : 0;

			const helpText =
				limit < 1
					? __( 'Wartość 0 — używany jest domyślny limit z ustawień wtyczki.', 'us-ogloszenia' )
					: sprintf(
							/* translators: %d: number of announcements. */
							__( 'Wyświetlanych zostanie maksymalnie %d ogłoszeń.', 'us-ogloszenia' ),
							limit
					  );

			return el(
				Fragment,
				null,
				el(
					InspectorControls,
					null,
					el(
						PanelBody,
						{
							title: __( 'Ogłoszenia', 'us-ogloszenia' ),
							initialOpen: true,
						},
						el( RangeControl, {
							label: __( 'Limit', 'us-ogloszenia' ),
							value: limit,
							onChange: function ( value ) {
								setAttributes( { limit: value === undefined ? 0 : value } );
							},
							min: 0,
							max: MAX_LIMIT,
							help: helpText,
						} )
					)
				),
				el(
					'div',
					blockProps,
					el( ServerSideRender, {
						block: 'us-ogloszenia/ogloszenia',
						attributes: attributes,
					} )
				)
			);
		},
		save: function () {
			return null;
		},
	} );
} )(
	window.wp.blocks,
	window.wp.blockEditor,
	window.wp.components,
	window.wp.element,
	window.wp.serverSideRender,
	window.wp.i18n
);
