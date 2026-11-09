<?php
/**
 * Enqueue styles.
 *
 * @package US_Ogloszenia
 */

declare( strict_types=1 );

namespace US_Ogloszenia;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Public and admin assets.
 */
final class Assets {

	private static bool $shortcode_used = false;

	public static function register_hooks(): void {
		add_action( 'wp_enqueue_scripts', array( self::class, 'maybe_enqueue_public' ) );
		add_action( 'wp_footer', array( self::class, 'maybe_enqueue_public_late' ), 5 );
		add_action( 'enqueue_block_assets', array( self::class, 'enqueue_block_assets' ) );
		add_action( 'admin_enqueue_scripts', array( self::class, 'enqueue_admin' ) );
	}

	public static function flag_shortcode_used(): void {
		self::$shortcode_used = true;
	}

	public static function maybe_enqueue_public(): void {
		if ( self::content_may_contain_shortcode() ) {
			self::enqueue_public();
		}
	}

	public static function maybe_enqueue_public_late(): void {
		if ( self::$shortcode_used && ! wp_style_is( 'us-ogloszenia-public', 'enqueued' ) ) {
			self::enqueue_public();
		}
	}

	private static function content_may_contain_shortcode(): bool {
		if ( ! is_singular() ) {
			return false;
		}

		global $post;
		if ( ! $post instanceof \WP_Post ) {
			return false;
		}

		return self::content_has_ogloszenia( $post->post_content );
	}

	public static function content_has_ogloszenia( string $content ): bool {
		if ( has_shortcode( $content, Shortcode::TAG ) ) {
			return true;
		}

		return function_exists( 'has_block' ) && has_block( Block::BLOCK_NAME, $content );
	}

	public static function enqueue_block_assets(): void {
		if ( is_admin() ) {
			self::enqueue_public();
			return;
		}

		if ( self::$shortcode_used ) {
			self::enqueue_public();
			return;
		}

		if ( is_singular() ) {
			global $post;
			if ( $post instanceof \WP_Post && self::content_has_ogloszenia( $post->post_content ) ) {
				self::enqueue_public();
			}
		}
	}

	public static function enqueue_public(): void {
		if ( wp_style_is( 'us-ogloszenia-public', 'enqueued' ) ) {
			return;
		}

		wp_enqueue_style(
			'us-ogloszenia-public',
			US_OGLOSZENIA_URL . 'assets/css/public.css',
			array(),
			US_OGLOSZENIA_VERSION
		);

		$color = get_option( Settings::OPTION_COLOR, '#b45309' );
		if ( ! is_string( $color ) || ! sanitize_hex_color( $color ) ) {
			$color = '#b45309';
		}

		$inline = sprintf(
			':root { --us-important-color: %s; }',
			esc_attr( $color )
		);
		wp_add_inline_style( 'us-ogloszenia-public', $inline );
	}

	/**
	 * @param string $hook_suffix Current admin page hook.
	 */
	public static function enqueue_admin( string $hook_suffix ): void {
		$screens = array( 'post.php', 'post-new.php' );
		if ( ! in_array( $hook_suffix, $screens, true ) ) {
			return;
		}

		$screen = get_current_screen();
		if ( ! $screen || Post_Type::POST_TYPE !== $screen->post_type ) {
			return;
		}

		wp_enqueue_style(
			'us-ogloszenia-admin',
			US_OGLOSZENIA_URL . 'assets/css/admin.css',
			array(),
			US_OGLOSZENIA_VERSION
		);
	}
}
