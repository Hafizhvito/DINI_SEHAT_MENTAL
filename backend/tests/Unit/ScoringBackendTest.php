<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Http\Controllers\RespondentController;

class ScoringBackendTest extends TestCase
{
    public function test_expected_stress_level_thresholds(): void
    {
        $controller = new RespondentController();

        $this->assertEquals('rendah', $controller->getExpectedStressLevel(0.0));
        $this->assertEquals('rendah', $controller->getExpectedStressLevel(19.0));
        $this->assertEquals('sedang', $controller->getExpectedStressLevel(20.0));
        $this->assertEquals('sedang', $controller->getExpectedStressLevel(38.0));
        $this->assertEquals('tinggi', $controller->getExpectedStressLevel(40.0));
        $this->assertEquals('tinggi', $controller->getExpectedStressLevel(100.0));
    }
}
