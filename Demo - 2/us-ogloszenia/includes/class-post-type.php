<?php
/**
 * Custom post type Ogłoszenie.
 *
 * @package US_Ogloszenia
 */

declare( strict_types=1 );

namespace US_Ogloszenia;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers CPT us_ogloszenie (admin + shortcode only, no public singles).
 */
final class Post_Type {

	public const POST_TYPE = 'us_ogloszenie';

	public static function register_hooks(): void {
		add_action( 'init', array( self::class, 'register' ) );
	}

	public static function register(): void {
		$labels = array(
			'name'               => _x( 'Ogłoszenia', 'post type general name', 'us-ogloszenia' ),
			'singular_name'      => _x( 'Ogłoszenie', 'post type singular name', 'us-ogloszenia' ),
			'menu_name'          => _x( 'Ogłoszenia', 'admin menu', 'us-ogloszenia' ),
			'add_new'            => __( 'Dodaj nowe', 'us-ogloszenia' ),
			'add_new_item'       => __( 'Dodaj ogłoszenie', 'us-ogloszenia' ),
			'edit_item'          => __( 'Edytuj ogłoszenie', 'us-ogloszenia' ),
			'new_item'           => __( 'Nowe ogłoszenie', 'us-ogloszenia' ),
			'view_item'          => __( 'Zobacz ogłoszenie', 'us-ogloszenia' ),
			'search_items'       => __( 'Szukaj ogłoszeń', 'us-ogloszenia' ),
			'not_found'          => __( 'Nie znaleziono ogłoszeń', 'us-ogloszenia' ),
			'not_found_in_trash' => __( 'Brak ogłoszeń w koszu', 'us-ogloszenia' ),
		);

		register_post_type(
			self::POST_TYPE,
			array(
				'labels'              => $labels,
				'public'              => false,
				'publicly_queryable'  => false,
				'show_ui'             => true,
				'show_in_menu'        => true,
				'menu_icon'           => 'dashicons-megaphone',
				'menu_position'       => 21,
				'capability_type'     => 'post',
				'map_meta_cap'        => true,
				'hierarchical'        => false,
				'supports'            => array( 'title', 'editor', 'revisions' ),
				'has_archive'         => false,
				'rewrite'             => false,
				'query_var'           => false,
				'show_in_rest'        => true,
			)
		);
	}
}
