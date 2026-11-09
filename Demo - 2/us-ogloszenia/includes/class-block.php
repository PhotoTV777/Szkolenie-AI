<?php
/**
 * Gutenberg block — Ogłoszenia.
 *
 * @package US_Ogloszenia
 */

declare( strict_types=1 );

namespace US_Ogloszenia;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Dynamic block us-ogloszenia/ogloszenia.
 */
final class Block {

	public const BLOCK_NAME = 'us-ogloszenia/ogloszenia';

	public static function register_hooks(): void {
		add_action( 'init', array( self::class, 'register' ) );
	}

	public static function register(): void {
		if ( ! function_exists( 'register_block_type' ) ) {
			return;
		}

		register_block_type(
			US_OGLOSZENIA_PATH . 'blocks/ogloszenia',
			array(
				'render_callback' => array( self::class, 'render' ),
			)
		);
	}

	/**
	 * @param array<string, mixed> $attributes Block attributes.
	 * @param string               $content    Block content (unused).
	 * @param mixed                $block      Block instance (unused).
	 */
	public static function render( array $attributes, string $content = '', $block = null ): string {
		unset( $content, $block );
		$raw_limit = isset( $attributes['limit'] ) ? (int) $attributes['limit'] : 0;
		$limit     = Shortcode::resolve_limit( $raw_limit );

		Assets::flag_shortcode_used();

		return Shortcode::render_list( $limit );
	}
}
