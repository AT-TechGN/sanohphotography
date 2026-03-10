<?php

namespace App\Controller\Api;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class AlbumController extends AbstractController
{
    #[Route('/api/album', name: 'app_api_album')]
    public function index(): Response
    {
        return $this->render('api/album/index.html.twig', [
            'controller_name' => 'Api/AlbumController',
        ]);
    }
}
