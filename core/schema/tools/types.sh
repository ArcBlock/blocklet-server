# core/types

sedi() {
    sed --version >/dev/null 2>&1 && sed -i -- "$@" || sed -i "" "$@"
}

files=../types/lib/*.d.ts

sedi '/google-protobuf/d' $files
sedi '/export const/d' $files
sedi '/^export class .* {$/,/^}$/g' $files
sedi 's/Array<\(.*\)>/\1[]/g' $files
sedi 's/google_protobuf_any_pb.Any/Record<string, any>/g' $files
sedi 's/Uint32/number/g' $files
sedi 's/Uint64/number/g' $files
sedi '/^[[:space:]]*$/d' $files
