import pygame

class Paddle:
    def __init__(self, x: int, y: int, width: int, height: int, speed: int, screen_width: int):
        """
        Args:
            x: 初期x座標
            y: 初期y座標
            width: 幅
            height: 高さ
            speed: 移動速度
            screen_width: 画面幅（境界判定用）
        """
        self.rect = pygame.Rect(x, y, width, height)
        self.speed = speed
        self.screen_width = screen_width

    def move_left(self):
        """パドルを左に移動"""
        self.rect.x -= self.speed
        self._clamp_position()

    def move_right(self):
        """パドルを右に移動"""
        self.rect.x += self.speed
        self._clamp_position()

    def _clamp_position(self):
        """画面外に移動しないよう境界をクリア"""
        self.rect.left = max(0, self.rect.left)
        self.rect.right = min(self.screen_width, self.rect.right)

    def get_position(self) -> int:
        """現在のx座標を取得"""
        return self.rect.x

    def get_rect(self) -> pygame.Rect:
        """矩形オブジェクトを取得"""
        return self.rect