<?php
/**
 * Uninstall US Ogłoszenia.
 *
 * @package US_Ogloszenia
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'us_ogloszenia_default_limit' );
delete_option( 'us_ogloszenia_important_color' );
