<?php
/**
 * Plugin Name:       US Ogłoszenia
 * Plugin URI:        https://example.com/us-ogloszenia
 * Description:       Krótkie ogłoszenia na stronie wydziału — CPT, shortcode i ustawienia.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            US Wydział
 * Text Domain:       us-ogloszenia
 * Domain Path:       /languages
 *
 * @package US_Ogloszenia
 */

declare( strict_types=1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'US_OGLOSZENIA_VERSION', '1.0.0' );
define( 'US_OGLOSZENIA_PATH', plugin_dir_path( __FILE__ ) );
define( 'US_OGLOSZENIA_URL', plugin_dir_url( __FILE__ ) );
define( 'US_OGLOSZENIA_BASENAME', plugin_basename( __FILE__ ) );

require_once US_OGLOSZENIA_PATH . 'includes/class-plugin.php';

/**
 * Plugin bootstrap.
 */
function us_ogloszenia_init(): void {
	\US_Ogloszenia\Plugin::instance()->boot();
}
add_action( 'plugins_loaded', 'us_ogloszenia_init' );

register_activation_hook(
	__FILE__,
	static function (): void {
		require_once US_OGLOSZENIA_PATH . 'includes/class-post-type.php';
		\US_Ogloszenia\Post_Type::register();
		flush_rewrite_rules();

		if ( false === get_option( 'us_ogloszenia_default_limit' ) ) {
			add_option( 'us_ogloszenia_default_limit', 5 );
		}
		if ( false === get_option( 'us_ogloszenia_important_color' ) ) {
			add_option( 'us_ogloszenia_important_color', '#b45309' );
		}
	}
);

register_deactivation_hook(
	__FILE__,
	static function (): void {
		flush_rewrite_rules();
	}
);
