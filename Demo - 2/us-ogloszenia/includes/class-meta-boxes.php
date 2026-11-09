<?php
/**
 * Meta boxes for Ogłoszenie.
 *
 * @package US_Ogloszenia
 */

declare( strict_types=1 );

namespace US_Ogloszenia;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Expiry date and priority meta fields.
 */
final class Meta_Boxes {

	public const META_EXPIRES  = '_us_ogloszenie_expires';
	public const META_PRIORITY = '_us_ogloszenie_priority';

	public const PRIORITY_NORMAL    = 'normal';
	public const PRIORITY_IMPORTANT  = 'important';

	public static function register_hooks(): void {
		add_action( 'init', array( self::class, 'register_meta' ), 20 );
		add_action( 'add_meta_boxes', array( self::class, 'add_meta_boxes' ) );
		add_action( 'save_post_' . Post_Type::POST_TYPE, array( self::class, 'save' ), 10, 2 );
	}

	public static function register_meta(): void {
		register_post_meta(
			Post_Type::POST_TYPE,
			self::META_EXPIRES,
			array(
				'type'              => 'string',
				'single'            => true,
				'show_in_rest'      => true,
				'sanitize_callback' => array( self::class, 'sanitize_expires_meta' ),
				'auth_callback'     => array( self::class, 'meta_auth_callback' ),
			)
		);

		register_post_meta(
			Post_Type::POST_TYPE,
			self::META_PRIORITY,
			array(
				'type'              => 'string',
				'single'            => true,
				'show_in_rest'      => true,
				'sanitize_callback' => array( self::class, 'sanitize_priority_meta' ),
				'auth_callback'     => array( self::class, 'meta_auth_callback' ),
			)
		);
	}

	/**
	 * REST/meta updates: same capability as editing posts.
	 *
	 * @param bool   $allowed  Whether the user can add the meta.
	 * @param string $meta_key Meta key.
	 * @param mixed  $post_id  Post ID (REST may pass string).
	 */
	public static function meta_auth_callback( bool $allowed, string $meta_key, $post_id ): bool {
		unset( $allowed, $meta_key );
		$post_id = (int) $post_id;
		if ( $post_id <= 0 ) {
			return false;
		}
		return current_user_can( 'edit_post', $post_id );
	}

	/**
	 * @param mixed $meta_value Raw meta value.
	 */
	public static function sanitize_expires_meta( $meta_value ): string {
		if ( ! is_string( $meta_value ) ) {
			return '';
		}

		$meta_value = sanitize_text_field( $meta_value );
		if ( '' === $meta_value ) {
			return '';
		}

		if ( ! self::is_valid_expires_date( $meta_value ) ) {
			return '';
		}

		return $meta_value;
	}

	/**
	 * @param mixed $meta_value Raw meta value.
	 */
	public static function sanitize_priority_meta( $meta_value ): string {
		if ( ! is_string( $meta_value ) ) {
			return self::PRIORITY_NORMAL;
		}

		$meta_value = sanitize_text_field( $meta_value );
		if ( in_array( $meta_value, array( self::PRIORITY_NORMAL, self::PRIORITY_IMPORTANT ), true ) ) {
			return $meta_value;
		}

		return self::PRIORITY_NORMAL;
	}

	public static function is_valid_expires_date( string $date ): bool {
		if ( ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', $date ) ) {
			return false;
		}

		$parts = array_map( 'intval', explode( '-', $date ) );
		if ( 3 !== count( $parts ) ) {
			return false;
		}

		return checkdate( $parts[1], $parts[2], $parts[0] );
	}

	public static function add_meta_boxes(): void {
		add_meta_box(
			'us_ogloszenie_details',
			__( 'Szczegóły ogłoszenia', 'us-ogloszenia' ),
			array( self::class, 'render_meta_box' ),
			Post_Type::POST_TYPE,
			'side',
			'high'
		);
	}

	/**
	 * @param \WP_Post $post Post object.
	 */
	public static function render_meta_box( \WP_Post $post ): void {
		wp_nonce_field( 'us_ogloszenie_save_meta', 'us_ogloszenie_meta_nonce' );

		$expires  = get_post_meta( $post->ID, self::META_EXPIRES, true );
		$priority = get_post_meta( $post->ID, self::META_PRIORITY, true );

		if ( ! is_string( $priority ) || ! in_array( $priority, array( self::PRIORITY_NORMAL, self::PRIORITY_IMPORTANT ), true ) ) {
			$priority = self::PRIORITY_NORMAL;
		}

		$expires_value = '';
		if ( is_string( $expires ) && preg_match( '/^\d{4}-\d{2}-\d{2}$/', $expires ) ) {
			$expires_value = $expires;
		}
		?>
		<p>
			<label for="us_ogloszenie_expires">
				<strong><?php esc_html_e( 'Data ważności', 'us-ogloszenia' ); ?></strong>
			</label>
			<input
				type="date"
				id="us_ogloszenie_expires"
				name="us_ogloszenie_expires"
				value="<?php echo esc_attr( $expires_value ); ?>"
				class="widefat"
			/>
			<span class="description">
				<?php esc_html_e( 'Puste pole = ogłoszenie bezterminowe.', 'us-ogloszenia' ); ?>
			</span>
		</p>
		<p>
			<strong><?php esc_html_e( 'Priorytet', 'us-ogloszenia' ); ?></strong>
		</p>
		<p>
			<label>
				<input
					type="radio"
					name="us_ogloszenie_priority"
					value="<?php echo esc_attr( self::PRIORITY_NORMAL ); ?>"
					<?php checked( $priority, self::PRIORITY_NORMAL ); ?>
				/>
				<?php esc_html_e( 'Normalny', 'us-ogloszenia' ); ?>
			</label>
		</p>
		<p>
			<label>
				<input
					type="radio"
					name="us_ogloszenie_priority"
					value="<?php echo esc_attr( self::PRIORITY_IMPORTANT ); ?>"
					<?php checked( $priority, self::PRIORITY_IMPORTANT ); ?>
				/>
				<?php esc_html_e( 'Ważny', 'us-ogloszenia' ); ?>
			</label>
		</p>
		<?php
	}

	/**
	 * @param int      $post_id Post ID.
	 * @param \WP_Post $post    Post object.
	 */
	public static function save( int $post_id, \WP_Post $post ): void {
		if ( Post_Type::POST_TYPE !== $post->post_type ) {
			return;
		}

		if ( ! isset( $_POST['us_ogloszenie_meta_nonce'] ) ) {
			return;
		}

		$nonce = sanitize_text_field( wp_unslash( $_POST['us_ogloszenie_meta_nonce'] ) );
		if ( ! wp_verify_nonce( $nonce, 'us_ogloszenie_save_meta' ) ) {
			return;
		}

		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		if ( isset( $_POST['us_ogloszenie_expires'] ) ) {
			$raw = sanitize_text_field( wp_unslash( $_POST['us_ogloszenie_expires'] ) );
			if ( '' === $raw ) {
				delete_post_meta( $post_id, self::META_EXPIRES );
			} elseif ( self::is_valid_expires_date( $raw ) ) {
				update_post_meta( $post_id, self::META_EXPIRES, $raw );
			}
		}

		if ( isset( $_POST['us_ogloszenie_priority'] ) ) {
			$priority = self::sanitize_priority_meta( sanitize_text_field( wp_unslash( $_POST['us_ogloszenie_priority'] ) ) );
			update_post_meta( $post_id, self::META_PRIORITY, $priority );
		}
	}

	/**
	 * Today as Y-m-d in site timezone.
	 */
	public static function today_date_string(): string {
		return wp_date( 'Y-m-d' );
	}
}
