<?php
/**
 * Core plugin loader.
 *
 * @package US_Ogloszenia
 */

declare( strict_types=1 );

namespace US_Ogloszenia;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Singleton plugin orchestrator.
 */
final class Plugin {

	private static ?self $instance = null;

	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {}

	public function boot(): void {
		$this->load_dependencies();
		$this->register_hooks();
	}

	private function load_dependencies(): void {
		require_once US_OGLOSZENIA_PATH . 'includes/class-post-type.php';
		require_once US_OGLOSZENIA_PATH . 'includes/class-meta-boxes.php';
		require_once US_OGLOSZENIA_PATH . 'includes/class-shortcode.php';
		require_once US_OGLOSZENIA_PATH . 'includes/class-block.php';
		require_once US_OGLOSZENIA_PATH . 'includes/class-settings.php';
		require_once US_OGLOSZENIA_PATH . 'includes/class-assets.php';
	}

	private function register_hooks(): void {
		Post_Type::register_hooks();
		Meta_Boxes::register_hooks();
		Shortcode::register_hooks();
		Block::register_hooks();
		Settings::register_hooks();
		Assets::register_hooks();
	}
}
