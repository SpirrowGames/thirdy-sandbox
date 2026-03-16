import pytest
import pygame
from src.paddle import Paddle

def test_paddle_ball_collision():
    """パドルとボールの衝突判定テスト"""
    paddle = Paddle(400, 550, 100, 20, 7, 800)
    ball_rect = pygame.Rect(420, 540, 20, 20)  # パドルの上に位置するボール
    
    # 衝突判定
    is_colliding = paddle.get_rect().colliderect(ball_rect)
    assert is_colliding is True

def test_paddle_ball_no_collision():
    """パドルとボールの非衝突状態のテスト"""
    paddle = Paddle(400, 550, 100, 20, 7, 800)
    ball_rect = pygame.Rect(300, 500, 20, 20)  # パドルから離れた位置
    
    # 衝突判定
    is_colliding = paddle.get_rect().colliderect(ball_rect)
    assert is_colliding is False