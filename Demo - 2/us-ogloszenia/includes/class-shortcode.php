<?php
/**
 * Shortcode [us_ogloszenia].
 *
 * @package US_Ogloszenia
 */

declare( strict_types=1 );

namespace US_Ogloszenia;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Renders active announcements list.
 */
final class Shortcode {

	public const TAG = 'us_ogloszenia';

	/** Maksymalna liczba ogłoszeń zwracanych przez shortcode (ochrona przed nadużyciem). */
	public const MAX_LIMIT = 100;

	/** Górny limit rekordów pobieranych z bazy (ochrona przed DoS). */
	public const QUERY_CAP = 500;

	public static function register_hooks(): void {
		add_shortcode( self::TAG, array( self::class, 'render' ) );
	}

	/**
	 * @param array<string, string>|string $atts Shortcode attributes.
	 * @return string
	 */
	public static function render( $atts ): string {
		$default_limit = self::get_default_limit();

		$atts = shortcode_atts(
			array(
				'limit' => (string) $default_limit,
			),
			$atts,
			self::TAG
		);

		$limit = self::resolve_limit( (int) $atts['limit'] );

		Assets::flag_shortcode_used();

		return self::render_list( $limit );
	}

	public static function get_default_limit(): int {
		$default_limit = (int) get_option( 'us_ogloszenia_default_limit', 5 );
		if ( $default_limit < 1 ) {
			$default_limit = 5;
		}
		return min( self::MAX_LIMIT, $default_limit );
	}

	/**
	 * @param int $limit Raw limit; 0 or negative values fall back to plugin default.
	 */
	public static function resolve_limit( int $limit ): int {
		if ( $limit < 1 ) {
			$limit = self::get_default_limit();
		}
		return min( self::MAX_LIMIT, max( 1, $limit ) );
	}

	public static function render_list( int $limit ): string {
		$posts = self::get_active_announcements( $limit );

		$template = self::locate_template();
		if ( ! self::is_allowed_template( $template ) ) {
			$template = US_OGLOSZENIA_PATH . 'templates/ogloszenia-list.php';
		}

		ob_start();
		include $template;
		return (string) ob_get_clean();
	}

	/**
	 * @return \WP_Post[]
	 */
	public static function get_active_announcements( int $limit ): array {
		$today = Meta_Boxes::today_date_string();

		$query = new \WP_Query(
			array(
				'post_type'      => Post_Type::POST_TYPE,
				'post_status'    => 'publish',
				'posts_per_page' => self::QUERY_CAP,
				'orderby'        => 'date',
				'order'          => 'DESC',
				'no_found_rows'  => true,
			)
		);

		$active = array();

		foreach ( $query->posts as $post ) {
			if ( ! $post instanceof \WP_Post ) {
				continue;
			}

			$expires = get_post_meta( $post->ID, Meta_Boxes::META_EXPIRES, true );
			if ( is_string( $expires ) && '' !== $expires ) {
				if ( ! Meta_Boxes::is_valid_expires_date( $expires ) || $expires < $today ) {
					continue;
				}
			}

			$active[] = $post;
		}

		usort(
			$active,
			static function ( \WP_Post $a, \WP_Post $b ): int {
				$pa = get_post_meta( $a->ID, Meta_Boxes::META_PRIORITY, true );
				$pb = get_post_meta( $b->ID, Meta_Boxes::META_PRIORITY, true );

				$ia = ( Meta_Boxes::PRIORITY_IMPORTANT === $pa ) ? 0 : 1;
				$ib = ( Meta_Boxes::PRIORITY_IMPORTANT === $pb ) ? 0 : 1;

				if ( $ia !== $ib ) {
					return $ia <=> $ib;
				}

				return strtotime( $b->post_date ) <=> strtotime( $a->post_date );
			}
		);

		return array_slice( $active, 0, $limit );
	}

	public static function locate_template(): string {
		$theme_template = locate_template( 'us-ogloszenia/ogloszenia-list.php' );
		if ( $theme_template ) {
			/**
			 * Filters the template path used for the announcements list.
			 *
			 * @param string $path Absolute path to template file.
			 */
			$path = (string) apply_filters( 'us_ogloszenia_template_path', $theme_template );
			if ( self::is_allowed_template( $path ) ) {
				return $path;
			}
		}

		$plugin_template = US_OGLOSZENIA_PATH . 'templates/ogloszenia-list.php';
		$path            = (string) apply_filters( 'us_ogloszenia_template_path', $plugin_template );
		if ( self::is_allowed_template( $path ) ) {
			return $path;
		}

		return $plugin_template;
	}

	/**
	 * Safe announcement body HTML (no shortcode execution).
	 *
	 * @param \WP_Post $post Post object.
	 */
	public static function get_post_content_html( \WP_Post $post ): string {
		$content = is_string( $post->post_content ) ? $post->post_content : '';
		$html    = wpautop( $content );
		$html    = wp_kses_post( $html );

		/**
		 * Filters sanitized announcement HTML shown on the front end.
		 *
		 * @param string   $html Sanitized HTML.
		 * @param \WP_Post $post Post object.
		 */
		return (string) apply_filters( 'us_ogloszenia_content_html', $html, $post );
	}

	/**
	 * Whether a template path is inside the plugin or active theme (prevents LFI via filter).
	 *
	 * @param string $path Absolute filesystem path.
	 */
	public static function is_allowed_template( string $path ): bool {
		if ( '' === $path || ! is_file( $path ) || ! is_readable( $path ) ) {
			return false;
		}

		$real = realpath( $path );
		if ( false === $real ) {
			return false;
		}

		$real = wp_normalize_path( $real );
		if ( ! preg_match( '/\.php$/i', $real ) ) {
			return false;
		}

		$roots = array(
			wp_normalize_path( US_OGLOSZENIA_PATH ),
			wp_normalize_path( get_stylesheet_directory() ),
			wp_normalize_path( get_template_directory() ),
		);

		foreach ( $roots as $root ) {
			if ( '' === $root ) {
				continue;
			}
			$root = trailingslashit( $root );
			if ( strncmp( $real, $root, strlen( $root ) ) === 0 ) {
				return true;
			}
		}

		return false;
	}

	public static function is_important( int $post_id ): bool {
		$priority = get_post_meta( $post_id, Meta_Boxes::META_PRIORITY, true );
		return Meta_Boxes::PRIORITY_IMPORTANT === $priority;
	}
}
