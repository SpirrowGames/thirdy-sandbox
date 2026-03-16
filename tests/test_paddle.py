import pytest
import pygame
from src.paddle import Paddle

@pytest.fixture
def setup_paddle():
    """テスト用パドルの初期化"""
    screen_width = 800
    paddle = Paddle(400, 550, 100, 20, 7, screen_width)
    return paddle, screen_width

def test_initial_position(setup_paddle):
    """初期位置の検証"""
    paddle, _ = setup_paddle
    assert paddle.get_position() == 400

def test_move_left(setup_paddle):
    """左移動の動作確認"""
    paddle, _ = setup_paddle
    initial_x = paddle.get_position()
    paddle.move_left()
    assert paddle.get_position() == initial_x - 7

def test_move_right(setup_paddle):
    """右移動の動作確認"""
    paddle, _ = setup_paddle
    initial_x = paddle.get_position()
    paddle.move_right()
    assert paddle.get_position() == initial_x + 7

def test_left_edge_clamping(setup_paddle):
    """左端境界判定の検証"""
    paddle, _ = setup_paddle
    paddle.rect.left = 0
    paddle.move_left()
    assert paddle.rect.left == 0

def test_right_edge_clamping(setup_paddle):
    """右端境界判定の検証"""
    paddle, screen_width = setup_paddle
    paddle.rect.right = screen_width
    paddle.move_right()
    assert paddle.rect.right == screen_width

def test_rect_boundaries(setup_paddle):
    """矩形境界の検証"""
    paddle, _ = setup_paddle
    assert paddle.get_rect().width == 100
    assert paddle.get_rect().height == 20