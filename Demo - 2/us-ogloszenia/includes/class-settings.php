<?php
/**
 * Plugin settings page.
 *
 * @package US_Ogloszenia
 */

declare( strict_types=1 );

namespace US_Ogloszenia;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Settings API: default limit and important highlight color.
 */
final class Settings {

	public const OPTION_LIMIT = 'us_ogloszenia_default_limit';
	public const OPTION_COLOR = 'us_ogloszenia_important_color';

	public const PAGE_SLUG = 'us-ogloszenia-settings';

	public static function register_hooks(): void {
		add_action( 'admin_menu', array( self::class, 'add_menu' ) );
		add_action( 'admin_init', array( self::class, 'register_settings' ) );
	}

	public static function add_menu(): void {
		add_submenu_page(
			'edit.php?post_type=' . Post_Type::POST_TYPE,
			__( 'Ustawienia ogłoszeń', 'us-ogloszenia' ),
			__( 'Ustawienia', 'us-ogloszenia' ),
			'manage_options',
			self::PAGE_SLUG,
			array( self::class, 'render_page' )
		);
	}

	public static function register_settings(): void {
		register_setting(
			'us_ogloszenia_settings',
			self::OPTION_LIMIT,
			array(
				'type'              => 'integer',
				'sanitize_callback' => array( self::class, 'sanitize_limit' ),
				'default'           => 5,
			)
		);

		register_setting(
			'us_ogloszenia_settings',
			self::OPTION_COLOR,
			array(
				'type'              => 'string',
				'sanitize_callback' => array( self::class, 'sanitize_color' ),
				'default'           => '#b45309',
			)
		);

		add_settings_section(
			'us_ogloszenia_main',
			__( 'Wyświetlanie', 'us-ogloszenia' ),
			static function (): void {
				echo '<p>' . esc_html__( 'Opcje shortcode [us_ogloszenia] i bloku „Ogłoszenia”.', 'us-ogloszenia' ) . '</p>';
			},
			self::PAGE_SLUG
		);

		add_settings_field(
			self::OPTION_LIMIT,
			__( 'Domyślny limit', 'us-ogloszenia' ),
			array( self::class, 'field_limit' ),
			self::PAGE_SLUG,
			'us_ogloszenia_main'
		);

		add_settings_field(
			self::OPTION_COLOR,
			__( 'Kolor wyróżnienia ważnych', 'us-ogloszenia' ),
			array( self::class, 'field_color' ),
			self::PAGE_SLUG,
			'us_ogloszenia_main'
		);
	}

	/**
	 * @param mixed $value Raw option value.
	 */
	public static function sanitize_limit( $value ): int {
		$limit = (int) $value;
		return min( Shortcode::MAX_LIMIT, max( 1, $limit ) );
	}

	/**
	 * @param mixed $value Raw option value.
	 */
	public static function sanitize_color( $value ): string {
		$default = '#b45309';
		if ( ! is_string( $value ) ) {
			return $default;
		}

		$value = sanitize_hex_color( $value );
		if ( ! $value ) {
			return $default;
		}

		return $value;
	}

	public static function field_limit(): void {
		$value = (int) get_option( self::OPTION_LIMIT, 5 );
		?>
		<input
			type="number"
			name="<?php echo esc_attr( self::OPTION_LIMIT ); ?>"
			id="<?php echo esc_attr( self::OPTION_LIMIT ); ?>"
			value="<?php echo esc_attr( (string) $value ); ?>"
			min="1"
			max="<?php echo esc_attr( (string) Shortcode::MAX_LIMIT ); ?>"
			class="small-text"
		/>
		<p class="description">
			<?php esc_html_e( 'Liczba ogłoszeń, gdy shortcode/blok nie podaje limitu (w bloku: suwak na 0).', 'us-ogloszenia' ); ?>
		</p>
		<?php
	}

	public static function field_color(): void {
		$value = get_option( self::OPTION_COLOR, '#b45309' );
		if ( ! is_string( $value ) ) {
			$value = '#b45309';
		}
		?>
		<input
			type="text"
			name="<?php echo esc_attr( self::OPTION_COLOR ); ?>"
			id="<?php echo esc_attr( self::OPTION_COLOR ); ?>"
			value="<?php echo esc_attr( $value ); ?>"
			class="regular-text"
			pattern="#[0-9A-Fa-f]{6}"
			placeholder="#b45309"
		/>
		<p class="description">
			<?php esc_html_e( 'Kolor obramowania / akcentu dla ogłoszeń ważnych (format #RRGGBB).', 'us-ogloszenia' ); ?>
		</p>
		<?php
	}

	public static function render_page(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
			<form action="options.php" method="post">
				<?php
				settings_fields( 'us_ogloszenia_settings' );
				do_settings_sections( self::PAGE_SLUG );
				submit_button();
				?>
			</form>
		</div>
		<?php
	}
}
