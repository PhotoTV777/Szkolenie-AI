<?php
/**
 * Template: lista ogłoszeń (shortcode).
 *
 * Variables: $posts (WP_Post[]).
 *
 * @package US_Ogloszenia
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use US_Ogloszenia\Meta_Boxes;
use US_Ogloszenia\Shortcode;

/** @var \WP_Post[] $posts */
if ( ! isset( $posts ) || ! is_array( $posts ) ) {
	$posts = array();
}
?>
<div class="us-ogloszenia">
	<?php if ( empty( $posts ) ) : ?>
		<p class="us-ogloszenia__empty"><?php esc_html_e( 'Brak aktualnych ogłoszeń.', 'us-ogloszenia' ); ?></p>
	<?php else : ?>
		<ul class="us-ogloszenia__list">
			<?php foreach ( $posts as $post ) : ?>
				<?php
				$important = Shortcode::is_important( $post->ID );
				$classes   = array( 'us-ogloszenia__item' );
				if ( $important ) {
					$classes[] = 'us-ogloszenia__item--important';
				}

				$expires = get_post_meta( $post->ID, Meta_Boxes::META_EXPIRES, true );
				$show_expires = is_string( $expires ) && '' !== $expires && Meta_Boxes::is_valid_expires_date( $expires );
				?>
				<li class="<?php echo esc_attr( implode( ' ', $classes ) ); ?>">
					<?php if ( $important ) : ?>
						<span class="us-ogloszenia__badge"><?php esc_html_e( 'Ważne', 'us-ogloszenia' ); ?></span>
					<?php endif; ?>
					<h3 class="us-ogloszenia__title"><?php echo esc_html( get_the_title( $post ) ); ?></h3>
					<div class="us-ogloszenia__content">
						<?php echo Shortcode::get_post_content_html( $post ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Kses inside helper. ?>
					</div>
					<?php if ( $show_expires ) : ?>
						<p class="us-ogloszenia__meta">
							<?php
							printf(
								/* translators: %s: expiry date (Y-m-d). */
								esc_html__( 'Ważne do: %s', 'us-ogloszenia' ),
								esc_html( wp_date( get_option( 'date_format' ), strtotime( $expires . ' 23:59:59' ) ) )
							);
							?>
						</p>
					<?php endif; ?>
				</li>
			<?php endforeach; ?>
		</ul>
	<?php endif; ?>
</div>
