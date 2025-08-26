SHELL := /bin/bash
.ONESHELL:
.PHONY: dev

dev:
	docker run -d --rm --name meili-dev \
		-p 7700:7700 \
		-v $(PWD)/meili_data:/meili_data \
		getmeili/meilisearch:v1.16
	/Users/jacobvelasquez/go/bin/air &

stop:
	docker stop meili-dev

build:
	go build ./...
